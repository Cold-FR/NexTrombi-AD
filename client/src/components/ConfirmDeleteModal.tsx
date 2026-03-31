import { AlertTriangle, X } from 'lucide-react';
import { type User } from './UserCard';
import { AnimatePresence, motion } from 'motion/react';
import {
  btnHover,
  btnTap,
  iconBtnHover,
  iconBtnTap,
  overlayVariants,
  modalVariants,
} from '../lib/motionVariants';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
  isLoading?: boolean;
  title?: string;
  description?: React.ReactNode;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
  title,
  description,
}: ConfirmDeleteModalProps) {
  if (!user) return null;

  const resolvedTitle = title ?? 'Supprimer la photo';
  const resolvedDescription = description ?? (
    <>
      Voulez-vous vraiment supprimer la photo de{' '}
      <span className="font-semibold text-gray-900 dark:text-white">
        {user.firstName} {user.lastName}
      </span>{' '}
      ? Cette action est irréversible.
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative w-full max-w-sm rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50/50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {resolvedTitle}
              </h3>
              <motion.button
                onClick={onClose}
                disabled={isLoading}
                whileHover={iconBtnHover}
                whileTap={iconBtnTap}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Corps */}
            <div className="p-6">
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{resolvedDescription}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <motion.button
                  onClick={onClose}
                  disabled={isLoading}
                  whileHover={btnHover}
                  whileTap={btnTap}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Annuler
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  disabled={isLoading}
                  whileHover={isLoading ? {} : btnHover}
                  whileTap={isLoading ? {} : btnTap}
                  className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Suppression…
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
