<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

class UploadService
{
    private const int|float MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private const array ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    public function __construct(
        #[Autowire('%kernel.project_dir%')] private readonly string $projectDir,
        private readonly SluggerInterface $slugger,
    ) {
    }

    /**
     * Pour le mode LOCAL : Sauvegarde l'image sur le disque en WebP.
     */
    public function handleLocalUpload(UploadedFile $file): string
    {
        $image = $this->validateAndLoadImage($file);

        $uploadsDirectory = $this->projectDir.'/public/uploads/photos';
        new Filesystem()->mkdir($uploadsDirectory, 0755);

        // On redimensionne à une taille raisonnable pour un trombi (ex: 400x400 max)
        $resizedImage = $this->resizeImage($image, 400, 400);

        $safeFilename = $this->slugger->slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $newFilename = $safeFilename.'-'.uniqid().'.webp';

        // Sauvegarde en WebP (qualité 80)
        imagewebp($resizedImage, $uploadsDirectory.'/'.$newFilename, 80);

        return $newFilename;
    }

    /**
     * Pour le mode AD : Retourne le flux binaire de l'image formatée en JPEG.
     */
    public function handleAdUpload(UploadedFile $file): string
    {
        $image = $this->validateAndLoadImage($file);

        // Microsoft recommande 96x96 pixels pour thumbnailPhoto
        $resizedImage = $this->resizeImage($image, 96, 96);

        // On capture le flux JPEG en mémoire (buffer) au lieu de l'écrire sur le disque
        ob_start();
        imagejpeg($resizedImage, null, 85);

        return ob_get_clean();
    }

    private function validateAndLoadImage(UploadedFile $file): \GdImage
    {
        if (!$file->isValid() || $file->getSize() > self::MAX_FILE_SIZE) {
            throw new \RuntimeException('Fichier invalide ou trop volumineux.');
        }

        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new \RuntimeException('Format d\'image non supporté.');
        }

        $sourcePath = $file->getPathname();
        $image = match ($mimeType) {
            'image/jpeg', 'image/jpg' => imagecreatefromjpeg($sourcePath),
            'image/png' => imagecreatefrompng($sourcePath),
            'image/webp' => imagecreatefromwebp($sourcePath),
        };

        if (!$image) {
            throw new \RuntimeException('Impossible de lire l\'image.');
        }

        return $image;
    }

    private function resizeImage(\GdImage $sourceImage, int $maxWidth, int $maxHeight): \GdImage
    {
        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Calcul du ratio pour garder les proportions (aspect cover)
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        if ($ratio >= 1) {
            // L'image est déjà plus petite que les dimensions max
            $newWidth = $width;
            $newHeight = $height;
        } else {
            $newWidth = (int) round($width * $ratio);
            $newHeight = (int) round($height * $ratio);
        }

        $newImage = imagecreatetruecolor($newWidth, $newHeight);

        // Gestion de la transparence
        imagealphablending($newImage, false);
        imagesavealpha($newImage, true);
        $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
        imagefilledrectangle($newImage, 0, 0, $newWidth, $newHeight, $transparent);

        imagecopyresampled($newImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $newImage;
    }
}
