import { Mail, Phone, Camera, Trash2, Eye, EyeOff, Pencil } from 'lucide-react';
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { btnHover, btnTap, iconBtnHover, iconBtnTap } from '../lib/motionVariants';
import { SecureImage } from './SecureImage';
import { PhotoLightbox } from './PhotoLightbox';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  hidden?: boolean;
  isCustom?: boolean;
};

interface UserCardProps {
  user: User;
  isAdmin: boolean;
  isOwnProfile: boolean;
  onEditPhoto?: (userId: string) => void;
  onDeletePhoto?: (userId: string) => void;
  onToggleHidden?: (userId: string) => void;
  onEditCustomUser?: (userId: string) => void;
  onDeleteCustomUser?: (userId: string) => void;
}

export default memo(function UserCard({
  user,
  isAdmin,
  isOwnProfile,
  onEditPhoto,
  onDeletePhoto,
  onToggleHidden,
  onEditCustomUser,
  onDeleteCustomUser,
}: UserCardProps) {
  // Défense contre des champs undefined si le backend renvoie un objet incomplet
  const firstName = user.firstName ?? '';
  const lastName = user.lastName ?? '';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';

  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <motion.div
      animate={{ opacity: user.hidden ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      className={`h-full w-full rounded-xl border bg-white shadow-sm dark:bg-gray-800 ${
        user.hidden
          ? 'border-dashed border-gray-300 dark:border-gray-600'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="relative flex h-full flex-col items-center px-4 pt-6 pb-6">
        {/* AVATAR CONTAINER */}
        <div className="group/card relative mb-4">
          {user.photoUrl ? (
            <button
              onClick={() => setLightboxOpen(true)}
              className="focus:ring-primary-500 block cursor-zoom-in rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none"
              title="Agrandir la photo"
              type="button"
            >
              <SecureImage
                className="h-24 w-24 rounded-full border-2 border-gray-50 object-cover shadow-sm dark:border-gray-700"
                src={user.photoUrl}
                alt={`Photo de ${firstName}`}
              />
            </button>
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

          {/* BOUTON DE SUPPRESSION (Admin et user du profil seulement, uniquement si une photo existe) */}
          {(isAdmin || isOwnProfile) && onDeletePhoto && user.photoUrl && (
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

        {/* BOUTON CACHER/AFFICHER — admin uniquement, coin haut droit */}
        {isAdmin && onToggleHidden && (
          <motion.button
            onClick={() => onToggleHidden(user.id)}
            whileHover={iconBtnHover}
            whileTap={iconBtnTap}
            className={`absolute top-3 right-3 rounded-full p-1.5 shadow-sm ring-1 transition-colors ${
              user.hidden
                ? 'bg-amber-100 text-amber-600 ring-amber-200 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:ring-amber-700'
                : 'bg-gray-100 text-gray-400 ring-gray-200 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:ring-gray-600 dark:hover:text-gray-300'
            }`}
            title={user.hidden ? 'Rendre visible' : 'Cacher cet utilisateur'}
          >
            {user.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </motion.button>
        )}

        {/* BOUTON MODIFIER (custom users uniquement, admin) — coin haut gauche */}
        {isAdmin && user.isCustom && onEditCustomUser && (
          <motion.button
            onClick={() => onEditCustomUser(user.id)}
            whileHover={iconBtnHover}
            whileTap={iconBtnTap}
            className="absolute top-3 left-3 rounded-full bg-gray-100 p-1.5 text-gray-400 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:ring-gray-600 dark:hover:text-gray-300"
            title="Modifier ce collaborateur"
          >
            <Pencil size={14} />
          </motion.button>
        )}

        {/* BOUTON SUPPRIMER (custom users uniquement, admin) — coin haut gauche */}
        {isAdmin && user.isCustom && onDeleteCustomUser && (
          <motion.button
            onClick={() => onDeleteCustomUser(user.id)}
            whileHover={iconBtnHover}
            whileTap={iconBtnTap}
            className="absolute top-3 left-12 rounded-full bg-gray-100 p-1.5 text-gray-400 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:ring-gray-600 dark:hover:text-gray-300"
            title="Supprimer ce collaborateur"
          >
            <Trash2 size={14} />
          </motion.button>
        )}

        {/* INFORMATIONS */}
        <h5
          className="mb-1 line-clamp-2 w-full text-center text-xl font-medium text-gray-900 dark:text-white"
          title={`${firstName} ${lastName}`}
        >
          {firstName} {lastName}
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

        {/* BADGE CACHÉ — visible uniquement pour les admins */}
        {isAdmin && user.hidden && (
          <span className="-mt-4 mb-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Masqué
          </span>
        )}

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

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && user.photoUrl && (
          <PhotoLightbox
            src={user.photoUrl}
            alt={`Photo de ${firstName} ${lastName}`}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});
