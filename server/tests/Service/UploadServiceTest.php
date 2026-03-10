<?php

namespace App\Tests\Service;

use App\Service\UploadService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\AsciiSlugger;

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
        $image = imagecreatetruecolor($width, $height);
        imagejpeg($image, $path);

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

        $savedPath = $this->tempDir.'/public/uploads/photos/'.$filename;
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

        $savedPath = $this->tempDir.'/public/uploads/photos/'.$filename;
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
}
