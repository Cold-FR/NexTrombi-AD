import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SecureImage({ src, alt, className }: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!src) return;

    let objectUrl: string | null = null;
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

        // On transforme l'image reçue en un Blob (donnée brute)
        const blob = await response.blob();

        if (isMounted) {
          // On crée une URL temporaire locale
          objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
        }
      } catch (error) {
        console.error("Impossible de charger l'image protégée", error);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, token]);

  if (!imageSrc) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}></div>;
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}
