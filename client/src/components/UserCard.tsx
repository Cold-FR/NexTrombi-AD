import { Mail, Phone, Camera, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { btnHover, btnTap, iconBtnHover, iconBtnTap } from '../lib/motionVariants';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  email: string;
  phone: string;
  photoUrl: string | null;
};

interface UserCardProps {
  user: User;
  isAdmin: boolean;
  onEditPhoto?: (userId: string) => void;
  onDeletePhoto?: (userId: string) => void;
}

export default function UserCard({ user, isAdmin, onEditPhoto, onDeletePhoto }: UserCardProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 }, // Commence transparent et un peu plus bas
    show: { opacity: 1, y: 0 }, // Glisse vers sa place normale
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ boxShadow: '0 10px 30px -8px rgba(0,0,0,0.15)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group/card w-full rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex h-full flex-col items-center px-4 pt-6 pb-6">
        {/* AVATAR CONTAINER */}
        <div className="relative mb-4">
          {user.photoUrl ? (
            <img
              className="h-24 w-24 rounded-full border-2 border-gray-50 object-cover shadow-sm dark:border-gray-700"
              src={user.photoUrl}
              alt={`Photo de ${user.firstName}`}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gray-50 bg-gray-100 shadow-sm dark:border-gray-600 dark:bg-gray-700">
              <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                {initials}
              </span>
            </div>
          )}

          {/* BOUTON D'ÉDITION (Admin seulement) */}
          {isAdmin && onEditPhoto && (
            <motion.button
              onClick={() => onEditPhoto(user.id)}
              whileHover={iconBtnHover}
              whileTap={iconBtnTap}
              className="bg-primary-600 hover:bg-primary-700 absolute bottom-0 left-0 rounded-full p-2 text-white shadow-md ring-2 ring-white transition-opacity sm:opacity-0 sm:group-hover/card:opacity-100 dark:ring-gray-800"
              title="Modifier la photo"
            >
              <Camera size={16} />
            </motion.button>
          )}

          {/* BOUTON DE SUPPRESSION (Admin seulement, uniquement si une photo existe) */}
          {isAdmin && onDeletePhoto && user.photoUrl && (
            <motion.button
              onClick={() => onDeletePhoto(user.id)}
              whileHover={iconBtnHover}
              whileTap={iconBtnTap}
              className="absolute right-0 bottom-0 rounded-full bg-red-600 p-2 text-white shadow-md ring-2 ring-white transition-opacity hover:bg-red-700 sm:opacity-0 sm:group-hover/card:opacity-100 dark:ring-gray-800"
              title="Supprimer la photo"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>

        {/* INFORMATIONS */}
        <h5
          className="mb-1 line-clamp-2 w-full text-center text-xl font-medium text-gray-900 dark:text-white"
          title={`${user.firstName} ${user.lastName}`}
        >
          {user.firstName} {user.lastName}
        </h5>
        <span
          className="mb-3 line-clamp-3 flex min-h-10 w-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400"
          title={user.jobTitle}
        >
          {user.jobTitle}
        </span>

        {/* BADGE SERVICE */}
        <span className="mb-6 rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {user.department}
        </span>

        {/* ACTIONS */}
        <div className="mt-auto flex w-full justify-center gap-2">
          <motion.a
            href={`mailto:${user.email}`}
            whileHover={btnHover}
            whileTap={btnTap}
            className="hover:text-primary-700 focus:text-primary-700 inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-100 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
          >
            <Mail size={16} className="mr-2" /> Email
          </motion.a>
          {user.phone && (
            <motion.a
              href={`tel:${user.phone}`}
              title="Appeler"
              whileHover={iconBtnHover}
              whileTap={iconBtnTap}
              className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:focus:ring-primary-800 inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-4 focus:outline-none"
            >
              <Phone size={16} />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
