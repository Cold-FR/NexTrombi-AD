import { Mail, Phone, Camera, Trash2 } from 'lucide-react';

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

  return (
    <div className="group/card w-full rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col items-center px-4 pt-6 pb-6">
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
            <button
              onClick={() => onEditPhoto(user.id)}
              className="bg-primary-600 hover:bg-primary-700 absolute bottom-0 left-0 rounded-full p-2 text-white shadow-md ring-2 ring-white transition-opacity sm:opacity-0 sm:group-hover/card:opacity-100 dark:ring-gray-800"
              title="Modifier la photo"
            >
              <Camera size={16} />
            </button>
          )}

          {/* BOUTON DE SUPPRESSION (Admin seulement, uniquement si une photo existe) */}
          {isAdmin && onDeletePhoto && user.photoUrl && (
            <button
              onClick={() => onDeletePhoto(user.id)}
              className="absolute right-0 bottom-0 rounded-full bg-red-600 p-2 text-white shadow-md ring-2 ring-white transition-opacity hover:bg-red-700 sm:opacity-0 sm:group-hover/card:opacity-100 dark:ring-gray-800"
              title="Supprimer la photo"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* INFORMATIONS */}
        <h5 className="mb-1 text-center text-xl font-medium text-gray-900 dark:text-white">
          {user.firstName} {user.lastName}
        </h5>
        <span className="mb-3 flex h-10 items-center text-center text-sm text-gray-500 dark:text-gray-400">
          {user.jobTitle}
        </span>

        {/* BADGE SERVICE */}
        <span className="mb-6 rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {user.department}
        </span>

        {/* ACTIONS */}
        <div className="mt-auto flex w-full justify-center gap-2">
          <a
            href={`mailto:${user.email}`}
            className="hover:text-primary-700 focus:text-primary-700 inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-100 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
          >
            <Mail size={16} className="mr-2" /> Email
          </a>
          {user.phone && (
            <a
              href={`tel:${user.phone}`}
              title="Appeler"
              className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:focus:ring-primary-800 inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-4 focus:outline-none"
            >
              <Phone size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
