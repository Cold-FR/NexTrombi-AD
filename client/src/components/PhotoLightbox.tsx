import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { SecureImage } from './SecureImage';
import { overlayVariants, iconBtnHover, iconBtnTap } from '../lib/motionVariants';

interface PhotoLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const imgVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export function PhotoLightbox({ src, alt, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      variants={overlayVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
    >
      {/* Bouton fermeture */}
      <motion.button
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
        whileHover={iconBtnHover}
        whileTap={iconBtnTap}
        onClick={onClose}
        aria-label="Fermer"
      >
        <X size={20} />
      </motion.button>

      {/* Image */}
      <motion.div
        variants={imgVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw]"
      >
        <SecureImage
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        />
      </motion.div>
    </motion.div>
  );
}
