/**
 * Constantes Motion réutilisables à travers toute l'application.
 */
import { type Variants } from 'motion/react';

// Boutons avec texte → élévation verticale (évite le grossissement de la police)
export const btnHover = { y: -2 };
export const btnTap = { y: 1 };

// Boutons iconiques (icône seule, pas de texte) → scale
export const iconBtnHover = { scale: 1.1 };
export const iconBtnTap = { scale: 0.9 };

// Overlay des modals (fond flouté)
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

// Panneau des modals (glisse vers le haut, courbe douce)
export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};
