import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { imageCache } from '../lib/imageCache';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SecureImage({ src, alt, className }: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(() => imageCache.get(src) ?? null);
  const { token } = useAuth();

  useEffect(() => {
    if (!src) return;

    // Déjà en cache → pas besoin de fetcher
    if (imageCache.has(src)) return;

    let isMounted = true;

    const fetchImage = async () => {
      try {
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Impossible de charger l'image protégée", 'Erreur de chargement');
          return;
        }

        const blob = await response.blob();

        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          imageCache.set(src, objectUrl);
          setImageSrc(objectUrl);
        }
      } catch (error) {
        console.error("Impossible de charger l'image protégée", error);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      // On ne révoque PAS l'objectUrl ici : il reste dans le cache
    };
  }, [src, token]);

  if (!imageSrc) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}></div>;
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}
