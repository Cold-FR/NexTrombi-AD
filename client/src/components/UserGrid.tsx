import { Loader2, SearchX } from 'lucide-react';
import { memo } from 'react';
import UserCard, { type User } from './UserCard';
import { AnimatePresence, motion } from 'motion/react';

const skeletonVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

const SkeletonCard = () => (
  <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex justify-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="mb-2 flex justify-center">
      <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="mb-1 flex justify-center">
      <div className="h-3 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700/60" />
    </div>
    <div className="mb-6 flex justify-center">
      <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700/60" />
    </div>
    <div className="mb-6 flex justify-center">
      <div className="h-5 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700/60" />
    </div>
    <div className="flex gap-2">
      <div className="h-9 flex-1 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/60" />
      <div className="h-9 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

interface UserGridProps {
  allUsers: User[];
  visibleUsers: User[];
  filteredCount: number;
  isAdmin: boolean;
  hasMore: boolean;
  isSearching: boolean;
  observerTarget: React.RefObject<HTMLDivElement | null>;
  onEditPhoto: (id: string) => void;
  onDeletePhoto: (id: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default memo(function UserGrid({
  allUsers,
  visibleUsers,
  filteredCount,
  isAdmin,
  hasMore,
  isSearching,
  observerTarget,
  onEditPhoto,
  onDeletePhoto,
}: UserGridProps) {
  const activeKey =
    allUsers.length === 0 || isSearching ? 'skeleton' : filteredCount === 0 ? 'empty' : 'grid';

  return (
    <>
      <AnimatePresence mode="wait">
        {activeKey === 'skeleton' && (
          <motion.div
            key="skeleton"
            variants={skeletonVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        )}

        {activeKey === 'empty' && (
          <motion.div
            key="empty"
            variants={contentVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-gray-400 shadow-sm dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-500">
                <SearchX size={28} />
              </div>
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Aucun résultat
            </p>
            <p className="mt-1 max-w-xs text-center text-sm text-gray-400 dark:text-gray-500">
              Aucun collaborateur ne correspond à votre recherche.
            </p>
          </motion.div>
        )}

        {activeKey === 'grid' && (
          <motion.div
            key="grid"
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
        )}
      </AnimatePresence>

      {hasMore && activeKey === 'grid' && (
        <div ref={observerTarget} className="mt-4 flex w-full justify-center py-10">
          <Loader2 className="text-primary-500 animate-spin" size={28} />
        </div>
      )}
    </>
  );
});
