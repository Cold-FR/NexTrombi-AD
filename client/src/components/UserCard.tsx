import { Mail, Phone, Camera } from 'lucide-react';

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
}

export default function UserCard({ user, isAdmin, onEditPhoto }: UserCardProps) {
    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

    return (
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group/card">
            <div className="flex flex-col items-center pb-6 pt-6 px-4">

                {/* AVATAR CONTAINER */}
                <div className="relative mb-4">
                    {user.photoUrl ? (
                        <img
                            className="w-24 h-24 rounded-full shadow-sm object-cover border-2 border-gray-50 dark:border-gray-700"
                            src={user.photoUrl}
                            alt={`Photo de ${user.firstName}`}
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full shadow-sm bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-50 dark:border-gray-600">
              <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                {initials}
              </span>
                        </div>
                    )}

                    {/* BOUTON D'ÉDITION (Admin seulement) */}
                    {isAdmin && onEditPhoto && (
                        <button
                            onClick={() => onEditPhoto(user.id)}
                            className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity shadow-md ring-2 ring-white dark:ring-gray-800"
                            title="Modifier la photo"
                        >
                            <Camera size={16} />
                        </button>
                    )}
                </div>

                {/* INFORMATIONS */}
                <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                </h5>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3 h-10 flex items-center">
          {user.jobTitle}
        </span>

                {/* BADGE SERVICE */}
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-md dark:bg-gray-700 dark:text-gray-300 mb-6 border border-gray-200 dark:border-gray-600">
          {user.department}
        </span>

                {/* ACTIONS */}
                <div className="flex mt-auto gap-2 w-full justify-center">
                    <a
                        href={`mailto:${user.email}`}
                        className="inline-flex flex-1 items-center justify-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-primary-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700 transition-colors"
                    >
                        <Mail size={16} className="mr-2" /> Email
                    </a>
                    {user.phone && (
                        <a
                            href={`tel:${user.phone}`}
                            title="Appeler"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:focus:ring-primary-800 transition-colors"
                        >
                            <Phone size={16} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}