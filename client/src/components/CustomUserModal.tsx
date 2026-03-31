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

  const isValid =
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.email.trim() !== '';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.trim();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      variants={overlayVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        variants={modalVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50/50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <UserPlus size={20} className="text-primary-600 dark:text-primary-500" />
            Créer un collaborateur
          </div>
          <motion.button
            whileHover={iconBtnHover}
            whileTap={iconBtnTap}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
            aria-label="Fermer"
          >
            <X size={20} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Jean"
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Dupont"
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
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
              className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
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
              className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              required
              placeholder="dupont.j@ste-savine.fr"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Téléphone
            </label>
            <input
              placeholder="0612345678"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <motion.button
              type="button"
              onClick={onClose}
              disabled={loading}
              whileHover={btnHover}
              whileTap={btnTap}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Annuler
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading || !isValid}
              whileHover={loading || !isValid ? {} : btnHover}
              whileTap={loading || !isValid ? {} : btnTap}
              className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {loading ? 'Création…' : 'Créer'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
}
