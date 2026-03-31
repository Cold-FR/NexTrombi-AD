import { useState, type SubmitEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import {
  btnHover,
  btnTap,
  iconBtnHover,
  iconBtnTap,
  overlayVariants,
  modalVariants,
} from '../lib/motionVariants';

interface CustomUserModalProps {
  onClose: () => void;
  onSubmit: (userData: unknown) => Promise<boolean>;
}

export function CustomUserModal({ onClose, onSubmit }: CustomUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    email: '',
    phone: '',
  });

  // Fermeture avec Échap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm dark:bg-black/60"
      variants={overlayVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        variants={modalVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <UserPlus size={20} className="text-primary-600 dark:text-primary-500" />
            Créer un utilisateur
          </div>
          <motion.button
            whileHover={iconBtnHover}
            whileTap={iconBtnTap}
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X size={20} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom *
              </label>
              <input
                placeholder="Jean"
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom *
              </label>
              <input
                placeholder="Dupont"
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fonction
            </label>
            <input
              placeholder="Agent"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Service / Équipe
            </label>
            <input
              placeholder="Ressources Humaines"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              placeholder="dupont.j@ste-savine.fr"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Téléphone
            </label>
            <input
              placeholder="06 12 34 56 78"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={btnHover}
              whileTap={btnTap}
              className="hover:text-primary-700 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Annuler
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : btnHover}
              whileTap={loading ? {} : btnTap}
              className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4 focus:outline-none disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <UserPlus size={18} className="mr-2" />
              )}
              Créer
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
}
