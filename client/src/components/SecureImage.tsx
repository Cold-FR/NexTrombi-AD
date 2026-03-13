import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { imageCache } from '../lib/imageCache';
import { useToast } from '../hooks/useToast';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SecureImage({ src, alt, className }: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(() => imageCache.get(src) ?? null);
  const { token, handleLogout } = useAuth();
  const { error: toastError } = useToast();

  useEffect(() => {
    if (!src) return;

    // Déjà en cache → on marque comme récemment utilisé et on se met à jour si besoin
    const cached = imageCache.get(src);
    if (cached !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageSrc(cached);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchImage = async () => {
      try {
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleLogout();
            toastError('Session expirée, veuillez vous reconnecter.');
          }
          return;
        }

        const blob = await response.blob();

        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          imageCache.set(src, objectUrl);
          setImageSrc(objectUrl);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error("Impossible de charger l'image protégée", error);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      controller.abort(); // Annule le fetch si le composant démonte avant la fin
    };
  }, [src, token, handleLogout, toastError]);

  if (!imageSrc) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}></div>;
  }

  return <img src={imageSrc} alt={alt} className={className} decoding="async" loading="lazy" />;
}
