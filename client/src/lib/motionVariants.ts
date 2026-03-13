import { type Variants } from 'motion/react';

// Boutons avec texte → élévation verticale (évite le grossissement de la police)
export const btnHover = { y: -2 };
export const btnTap = { y: 1 };

// Boutons iconiques (icône seule, pas de texte) → scale
export const iconBtnHover = { scale: 1.1 };
export const iconBtnTap = { scale: 0.9 };

// Transition lever/coucher de soleil — easings séparés x/y pour tracer un arc
const sunMoonDuration = 0.25;
export const sunMoonEnter = {
  x: { duration: sunMoonDuration, ease: 'linear' as const },
  y: { duration: sunMoonDuration, ease: 'easeOut' as const },
  opacity: { duration: sunMoonDuration * 0.6 },
};
export const sunMoonExit = {
  x: { duration: sunMoonDuration, ease: 'linear' as const },
  y: { duration: sunMoonDuration, ease: 'easeIn' as const },
  opacity: { duration: sunMoonDuration * 0.6, delay: sunMoonDuration * 0.4 },
};

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

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};
