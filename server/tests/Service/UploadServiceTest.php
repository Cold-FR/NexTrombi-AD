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
        $this->tempDir = sys_get_temp_dir().'/trombi_tests_'.uniqid();
        new Filesystem()->mkdir($this->tempDir);

        // Initialisation du service
        $this->uploadService = new UploadService(
            $this->tempDir, // Remplace %kernel.project_dir%
        );
    }

    protected function tearDown(): void
    {
        // Nettoyage : on supprime le dossier temporaire et son contenu après chaque test
        new Filesystem()->remove($this->tempDir);
    }

    /**
     * Helper : Crée une fausse image jpeg sur le disque pour nos tests.
     */
    private function createDummyImage(int $width, int $height, string $filename = 'test.jpg'): string
    {
        $path = $this->tempDir.'/'.$filename;
        imagejpeg(imagecreatetruecolor($width, $height), $path);

        return $path;
    }

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

    public function testHandleLocalUploadKeepsSmallDimensionsAndReturnsWebp(): void
    {
        $imgPath = $this->createDummyImage(200, 150, 'small.jpg');
        $file = new UploadedFile($imgPath, 'small.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);

        $this->assertStringEndsWith('.webp', $filename);

        $savedPath = $this->tempDir.'/var/uploads/photos/'.$filename;
        $this->assertFileExists($savedPath);

        $dimensions = getimagesize($savedPath);
        $this->assertEquals(200, $dimensions[0]);
        $this->assertEquals(150, $dimensions[1]);
    }

    public function testResizeImageResizesProportionally(): void
    {
        $imgPath = $this->createDummyImage(800, 600, 'large.jpg');
        $file = new UploadedFile($imgPath, 'large.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);

        $savedPath = $this->tempDir.'/var/uploads/photos/'.$filename;
        $this->assertFileExists($savedPath);

        $dimensions = getimagesize($savedPath);
        $this->assertEquals(400, $dimensions[0]);
        $this->assertEquals(300, $dimensions[1]);
    }

    public function testHandleAdUploadReturnsBinaryString(): void
    {
        $imgPath = $this->createDummyImage(500, 500, 'ad_profile.jpg');
        $file = new UploadedFile($imgPath, 'ad_profile.jpg', 'image/jpeg', \UPLOAD_ERR_OK, true);

        $binaryData = $this->uploadService->handleAdUpload($file);

        $this->assertNotEmpty($binaryData);
        $this->assertEquals("\xFF\xD8", substr($binaryData, 0, 2));
    }

    public function testHandleLocalUploadSupportsPng(): void
    {
        // On crée une vraie image PNG
        $path = $this->tempDir.'/test.png';
        $img = imagecreatetruecolor(10, 10);
        imagepng($img, $path);

        $file = new UploadedFile($path, 'test.png', 'image/png', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
    }

    public function testHandleLocalUploadSupportsWebp(): void
    {
        // On crée une vraie image WebP
        $path = $this->tempDir.'/test.webp';
        $img = imagecreatetruecolor(10, 10);
        imagewebp($img, $path);

        $file = new UploadedFile($path, 'test.webp', 'image/webp', \UPLOAD_ERR_OK, true);

        $filename = $this->uploadService->handleLocalUpload($file);
        $this->assertStringEndsWith('.webp', $filename);
    }

    public function testValidateAndLoadImageThrowsExceptionOnCorruptImage(): void
    {
        // On crée un fichier qui COMMENCE par les octets d'un JPEG (\xFF\xD8)
        // Cela garantit que $file->getMimeType() renverra 'image/jpeg'
        $path = $this->tempDir.'/fake_corrupt.jpg';
        file_put_contents($path, "\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46 Données corrompues");

        $file = new UploadedFile(
            $path,
            'test.jpg',
            'image/jpeg',
            null,
            true
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Impossible de lire l\'image.');

        $this->uploadService->handleLocalUpload($file);
    }
}
