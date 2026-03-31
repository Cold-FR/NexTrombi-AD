import { SearchX } from 'lucide-react';
import { memo, useEffect, useState, useMemo } from 'react';
import UserCard, { type User } from './UserCard';
import { AnimatePresence, motion } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { itemVariants } from '../lib/motionVariants';
import { CustomUserModal } from './CustomUserModal';

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

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
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

function useResponsiveColumns() {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1024) setCols(4);
      else if (window.innerWidth >= 768) setCols(3);
      else if (window.innerWidth >= 640) setCols(2);
      else setCols(1);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  return cols;
}

interface UserGridProps {
  allUsers: User[];
  visibleUsers: User[];
  filteredCount: number;
  isAdmin: boolean;
  loggedUsername: string | null;
  isSearching: boolean;
  onEditPhoto: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onCreateCustomUser?: (userData: unknown) => Promise<boolean>;
}

export default memo(function UserGrid({
  allUsers,
  visibleUsers,
  filteredCount,
  isAdmin,
  loggedUsername,
  isSearching,
  onEditPhoto,
  onDeletePhoto,
  onToggleHidden,
  onCreateCustomUser,
}: UserGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const activeKey =
    allUsers.length === 0 || isSearching ? 'skeleton' : filteredCount === 0 ? 'empty' : 'grid';

  const cols = useResponsiveColumns();

  const rows = useMemo(() => {
    const listToDisplay = (
      isAdmin && !isSearching && allUsers.length > 0
        ? [{ id: 'add-new-user-card', isFakeCard: true }, ...visibleUsers]
        : visibleUsers
    ) as (User & { isFakeCard?: boolean })[];

    const chunked = [];
    for (let i = 0; i < listToDisplay.length; i += cols) {
      chunked.push(listToDisplay.slice(i, i + cols));
    }
    return chunked;
  }, [visibleUsers, cols, isAdmin, isSearching, allUsers.length]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => document.querySelector('.scrollbar-overlay') as HTMLDivElement | null,
    estimateSize: () => 320,
    overscan: 3,
  });

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
            {Array.from({ length: cols * 3 }).map((_, i) => (
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
            variants={contentVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const y = virtualRow.start;
              const rowUsers = rows[virtualRow.index];

              return (
                <motion.div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${y}px)`,
                    paddingBottom: '1.5rem',
                  }}
                  className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  {rowUsers.map((user) => {
                    if (user.isFakeCard) {
                      return (
                        <motion.div key="add-btn" variants={itemVariants} className="h-full">
                          <motion.button
                            onClick={() => setModalOpen(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:bg-primary-900/20 flex h-full min-h-75 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-400 transition-colors dark:border-gray-700 dark:bg-gray-800/50"
                          >
                            <div className="rounded-full bg-white p-4 shadow-sm transition-transform group-hover:scale-110 dark:bg-gray-800">
                              <SearchX size={32} className="hidden" />{' '}
                              {/* Hack pour importer Lucide si besoin */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14" />
                                <path d="M12 5v14" />
                              </svg>
                            </div>
                            <span className="mt-4 font-medium">Ajouter un collaborateur</span>
                          </motion.button>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div key={user.id} variants={itemVariants} className="relative h-full">
                        <UserCard
                          user={user}
                          isOwnProfile={loggedUsername === user.id}
                          isAdmin={isAdmin}
                          onEditPhoto={onEditPhoto}
                          onDeletePhoto={onDeletePhoto}
                          onToggleHidden={isAdmin ? onToggleHidden : undefined}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && onCreateCustomUser && (
          <CustomUserModal onClose={() => setModalOpen(false)} onSubmit={onCreateCustomUser} />
        )}
      </AnimatePresence>
    </>
  );
});
