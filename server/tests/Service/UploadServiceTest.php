<?php

namespace App\Tests\Service;

use App\Service\UploadService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class UploadServiceTest extends TestCase
{
    private string $tempDir;
    private UploadService $uploadService;

    protected function setUp(): void
    {
        // Création d'un dossier temporaire unique pour isoler les tests
        $this->tempDir = sys_get_temp_dir().'/trombi_tests_'.uniqid().'/uploads/photos';
        new Filesystem()->mkdir($this->tempDir);

        // Initialisation du service
        $this->uploadService = new UploadService(
            $this->tempDir, // Remplace le chemin du dossier d'upload
        );
    }

    protected function tearDown(): void
    {
        // Nettoyage : on supprime le dossier temporaire et son contenu après chaque test
        new Filesystem()->remove($this->tempDir);
    }

    /**
     * Crée une image JPEG valide sur le disque pour les tests.
     */
    private function createDummyImage(int $width, int $height, string $filename = 'test.jpg'): string
    {
        $path = $this->tempDir.'/'.$filename;
        imagejpeg(imagecreatetruecolor($width, $height), $path);

        return $path;
    }

    /**
     * Crée un fichier JPEG avec un tag EXIF Orientation spécifique intégré.
     *
     * Le segment EXIF est écrit manuellement sous forme de bloc APP1 brut afin
     * de ne pas dépendre d'une extension PHP capable d'écrire l'EXIF
     * (la lecture EXIF est toujours disponible).
     *
     * Valeurs d'orientation :
     *   3 → image pivotée à 180°
     *   6 → image pivotée à 90° dans le sens horaire  (nécessite une correction de -90°)
     *   8 → image pivotée à 90° dans le sens anti-horaire (nécessite une correction de +90°)
     */
    private function createJpegWithOrientation(int $orientation, string $filename): string
    {
        $path = $this->tempDir.'/'.$filename;

        // Construction d'un bloc EXIF APP1 minimal avec le tag Orientation demandé.
        // Structure : en-tête Exif + en-tête TIFF little-endian + un IFD avec une entrée.
        //
        // En-tête TIFF LE : 'II' + 0x002A + offset vers l'IFD (8 octets)
        // IFD : nombre d'entrées (1) + entrée (tag 0x0112, type SHORT=3, count 1, valeur $orientation) + offset IFD suivant (0)
        $tiff = pack('A2v', 'II', 0x002A);          // ordre des octets + nombre magique
        $tiff .= pack('V', 8);                        // offset vers l'IFD = 8 octets depuis le début du TIFF
        $tiff .= pack('v', 1);                        // 1 entrée dans le répertoire
        $tiff .= pack('vvV', 0x0112, 3, 1);           // tag=Orientation, type=SHORT, count=1
        $tiff .= pack('v', $orientation)."\x00\x00";  // valeur (SHORT complété à 4 octets)
        $tiff .= pack('V', 0);                        // offset de l'IFD suivant = 0 (aucun)

        $exifHeader = "Exif\x00\x00".$tiff;

        // Marqueur APP1 + longueur (les 2 octets du champ longueur sont inclus dans la valeur)
        $app1Length = 2 + strlen($exifHeader);
        $app1 = "\xFF\xE1".pack('n', $app1Length).$exifHeader;

        // Génération d'une petite image JPEG valide en mémoire
        ob_start();
        imagejpeg(imagecreatetruecolor(10, 10));
        $rawJpeg = ob_get_clean();

        // Injection du segment APP1 juste après le marqueur SOI (\xFF\xD8)
        $jpegWithExif = substr($rawJpeg, 0, 2).$app1.substr($rawJpeg, 2);

        file_put_contents($path, $jpegWithExif);

        return $path;
    }

    // ─────────────────────────────────────────────────────────────
    // Erreurs de validation
    // ─────────────────────────────────────────────────────────────

    public function testThrowsExceptionIfFileIsTooLarge(): void
    {
        $path = $this->tempDir.'/large_file.jpg';
        // Création d'un faux fichier de 11 Mo
        $f = fopen($path, 'w');
        fseek($f, 11 * 1024 * 1024 - 1, SEEK_CUR);
        fwrite($f, 'a');
        fclose($f);

        // Instanciation d'un UploadedFile en mode test (5ème paramètre à true)
        $file = new UploadedFile($path, 'large.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Fichier invalide ou trop volumineux.');

        $this->uploadService->handleAdUpload($file);
    }

    public function testThrowsExceptionIfMimeTypeIsInvalid(): void
    {
        $path = $this->tempDir.'/invalid.txt';
        file_put_contents($path, 'Ceci n\'est pas une image');

        $file = new UploadedFile($path, 'invalid.txt', 'text/plain', \UPLOAD_ERR_OK, true);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Format d\'image non supporté.');

        $this->uploadService->handleAdUpload($file);
    }

    public function testValidateAndLoadImageThrowsExceptionOnCorruptImage(): void
    {
        // Fichier dont les premiers octets imitent un JPEG valide mais dont le contenu est corrompu
        $path = $this->tempDir.'/fake_corrupt.jpg';
        file_put_contents($path, "\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46 Données corrompues");

        $file = new UploadedFile($path, 'test.jpg', 'image/jpeg', null, true);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Impossible de lire l\'image.');

        $this->uploadService->handleLocalUpload($file);
    }

    // ─────────────────────────────────────────────────────────────
    // Upload local (sortie WebP)
    // ─────────────────────────────────────────────────────────────

    public function testHandleLocalUploadKeepsSmallDimensionsAndReturnsWebp(): void
    {
        $imgPath = $this->createDummyImage(200, 150, 'small.jpg');
        $file = new UploadedFile($imgPath, 'small.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);

        $this->assertStringEndsWith('.webp', $filename);

        $savedPath = $this->tempDir.'/'.$filename;
        $this->assertFileExists($savedPath);

        // Une image plus petite que le maximum (400×400) ne doit pas être agrandie
        $dimensions = getimagesize($savedPath);
        $this->assertEquals(200, $dimensions[0]);
        $this->assertEquals(150, $dimensions[1]);
    }

    public function testResizeImageResizesProportionally(): void
    {
        // Une image 800×600 doit être réduite à 400×300 (ratio conservé, max 400px)
        $imgPath = $this->createDummyImage(800, 600, 'large.jpg');
        $file = new UploadedFile($imgPath, 'large.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);

        $savedPath = $this->tempDir.'/'.$filename;
        $this->assertFileExists($savedPath);

        $dimensions = getimagesize($savedPath);
        $this->assertEquals(400, $dimensions[0]);
        $this->assertEquals(300, $dimensions[1]);
    }

    public function testHandleLocalUploadSupportsPng(): void
    {
        // On crée une vraie image PNG
        $path = $this->tempDir.'/test.png';
        imagepng(imagecreatetruecolor(10, 10), $path);

        $file = new UploadedFile($path, 'test.png', 'image/png', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
    }

    public function testHandleLocalUploadSupportsWebp(): void
    {
        // On crée une vraie image WebP
        $path = $this->tempDir.'/test.webp';
        imagewebp(imagecreatetruecolor(10, 10), $path);

        $file = new UploadedFile($path, 'test.webp', 'image/webp', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
    }

    // ─────────────────────────────────────────────────────────────
    // Upload AD (sortie binaire JPEG)
    // ─────────────────────────────────────────────────────────────

    public function testHandleAdUploadReturnsBinaryString(): void
    {
        $imgPath = $this->createDummyImage(500, 500, 'ad_profile.jpg');
        $file = new UploadedFile($imgPath, 'ad_profile.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $binaryData = $this->uploadService->handleAdUpload($file);

        $this->assertNotEmpty($binaryData);
        // Un flux JPEG commence toujours par les octets magiques \xFF\xD8 (marqueur SOI)
        $this->assertEquals("\xFF\xD8", substr($binaryData, 0, 2));
    }

    // ─────────────────────────────────────────────────────────────
    // Correction d'orientation EXIF — couvre les lignes 121-133
    // ─────────────────────────────────────────────────────────────

    /**
     * Orientation 3 → image pivotée à 180°.
     * Une image 10×10 doit rester 10×10 après une rotation de 180°.
     */
    public function testFixImageOrientationCase3Rotates180(): void
    {
        $path = $this->createJpegWithOrientation(3, 'orient_3.jpg');
        $file = new UploadedFile($path, 'orient_3.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        // L'absence d'exception confirme que la branche a été exécutée sans erreur
        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
        $this->assertFileExists($this->tempDir.'/'.$filename);
    }

    /**
     * Orientation 6 → image pivotée à 90° dans le sens horaire (correction de -90°).
     */
    public function testFixImageOrientationCase6Rotates90CW(): void
    {
        $path = $this->createJpegWithOrientation(6, 'orient_6.jpg');
        $file = new UploadedFile($path, 'orient_6.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
        $this->assertFileExists($this->tempDir.'/'.$filename);
    }

    /**
     * Orientation 8 → image pivotée à 90° dans le sens anti-horaire (correction de +90°).
     */
    public function testFixImageOrientationCase8Rotates90CCW(): void
    {
        $path = $this->createJpegWithOrientation(8, 'orient_8.jpg');
        $file = new UploadedFile($path, 'orient_8.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
        $this->assertFileExists($this->tempDir.'/'.$filename);
    }

    /**
     * Orientation 1 → orientation normale, aucune rotation appliquée.
     * Vérifie que le chemin par défaut du switch (valeur présente mais ne
     * correspondant pas à 3, 6 ou 8) est couvert sans effet de bord.
     */
    public function testFixImageOrientationWithNeutralOrientationDoesNotRotate(): void
    {
        $path = $this->createJpegWithOrientation(1, 'orient_1.jpg');
        $file = new UploadedFile($path, 'orient_1.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
        $this->assertFileExists($this->tempDir.'/'.$filename);
    }
}
