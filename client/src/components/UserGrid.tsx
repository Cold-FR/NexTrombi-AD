import { Loader2, SearchX } from 'lucide-react';
import UserCard, { type User } from './UserCard';
import { motion } from 'motion/react';

interface UserGridProps {
  allUsers: User[];
  visibleUsers: User[];
  filteredCount: number;
  isAdmin: boolean;
  hasMore: boolean;
  observerTarget: React.RefObject<HTMLDivElement | null>;
  onEditPhoto: (id: string) => void;
  onDeletePhoto: (id: string) => void;
}

export default function UserGrid({
  allUsers,
  visibleUsers,
  filteredCount,
  isAdmin,
  hasMore,
  observerTarget,
  onEditPhoto,
  onDeletePhoto,
}: UserGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }, // Chaque carte apparaît avec 0.1s de décalage
    },
  };

  // Chargement initial
  if (allUsers.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Avatar */}
            <div className="mb-4 flex justify-center">
              <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            {/* Nom */}
            <div className="mb-2 flex justify-center">
              <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            {/* Poste */}
            <div className="mb-1 flex justify-center">
              <div className="h-3 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700/60" />
            </div>
            <div className="mb-6 flex justify-center">
              <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700/60" />
            </div>
            {/* Badge service */}
            <div className="mb-6 flex justify-center">
              <div className="h-5 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700/60" />
            </div>
            {/* Boutons */}
            <div className="flex gap-2">
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/60" />
              <div className="h-9 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Aucun résultat de recherche
  if (filteredCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center py-24"
      >
        {/* Icône avec halo */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-gray-400 shadow-sm dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-500">
            <SearchX size={28} />
          </div>
        </div>
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Aucun résultat</p>
        <p className="mt-1 max-w-xs text-center text-sm text-gray-400 dark:text-gray-500">
          Aucun collaborateur ne correspond à votre recherche.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {visibleUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isAdmin={isAdmin}
            onEditPhoto={onEditPhoto}
            onDeletePhoto={onDeletePhoto}
          />
        ))}
      </motion.div>

      {hasMore && (
        <div ref={observerTarget} className="mt-4 flex w-full justify-center py-10">
          <Loader2 className="text-primary-500 animate-spin" size={28} />
        </div>
      )}
    </>
  );
}
