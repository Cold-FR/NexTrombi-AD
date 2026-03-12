import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
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
import { SecureImage } from './SecureImage';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, file: File) => void;
}

export default function PhotoUploadModal({ isOpen, onClose, user, onSave }: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Dériver l'URL d'aperçu : priorité au fichier local, sinon la photo existante
  const previewUrl = localPreviewUrl ?? user?.photoUrl ?? null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setLocalPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (user && selectedFile) {
      onSave(user.id, selectedFile);
      setSelectedFile(null);
      setLocalPreviewUrl(null);
      onClose();
    }
  };

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    onClose();
  }, [onClose]);

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

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
            className="relative w-full max-w-md rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50/50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Photo de profil
              </h3>
              <motion.button
                onClick={handleClose}
                whileHover={iconBtnHover}
                whileTap={iconBtnTap}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-6">
                  {previewUrl ? (
                    <SecureImage
                      src={previewUrl}
                      alt="Aperçu"
                      className="h-28 w-28 rounded-full border-4 border-gray-50 object-cover shadow-sm dark:border-gray-700"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gray-50 bg-gray-100 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                      <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">
                        {initials}
                      </span>
                    </div>
                  )}
                  <div className="bg-primary-600 absolute bottom-0 left-0 rounded-full p-2.5 text-white shadow-lg ring-4 ring-white dark:ring-gray-800">
                    <Upload size={16} />
                  </div>
                </div>

                <div className="w-full">
                  <label
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="file_input"
                  >
                    Sélectionner un fichier
                  </label>
                  <input
                    className="focus:border-primary-500 focus:ring-primary-500 block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 transition-colors focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
                    id="file_input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Formats acceptés : JPG, PNG, WEBP (Max. 2Mo).
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <motion.button
                  onClick={handleClose}
                  whileHover={btnHover}
                  whileTap={btnTap}
                  className="hover:text-primary-700 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  Annuler
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={!selectedFile}
                  whileHover={!selectedFile ? {} : btnHover}
                  whileTap={!selectedFile ? {} : btnTap}
                  className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:focus:ring-primary-800 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Enregistrer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
