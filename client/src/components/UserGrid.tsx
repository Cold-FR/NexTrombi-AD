import { SearchX } from 'lucide-react';
import { memo, useRef, useState, useEffect } from 'react';
import UserCard, { type User } from './UserCard';
import { AnimatePresence, motion } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';

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

// ── Détection responsive du nombre de colonnes ───────────────────────────────
const GAP = 24; // gap-6 = 1.5rem = 24px
const CARD_HEIGHT_ESTIMATE = 320;

// Variants pour le stagger par rangée
// La rangée elle-même ne s'anime pas visuellement, elle orchestre ses enfants
const rowStaggerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// Set module-level : cartes déjà animées → pas de ré-animation au scroll-back
const seenCardIds = new Set<string>();

function useColumnCount(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [columns, setColumns] = useState(4);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setColumns(w >= 1024 ? 4 : w >= 768 ? 3 : w >= 640 ? 2 : 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);
  return columns;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface UserGridProps {
  allUsers: User[];
  filteredUsers: User[];
  isAdmin: boolean;
  loggedUsername: string | null;
  isSearching: boolean;
  scrollContainerEl: HTMLDivElement | null;
  onEditPhoto: (id: string) => void;
  onDeletePhoto: (id: string) => void;
}

export default memo(function UserGrid({
  allUsers,
  filteredUsers,
  isAdmin,
  loggedUsername,
  isSearching,
  scrollContainerEl,
  onEditPhoto,
  onDeletePhoto,
}: UserGridProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(gridContainerRef);
  const rowCount = Math.ceil(filteredUsers.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerEl,
    estimateSize: () => CARD_HEIGHT_ESTIMATE,
    gap: GAP,
    overscan: 3,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const activeKey =
    allUsers.length === 0 || isSearching
      ? 'skeleton'
      : filteredUsers.length === 0
        ? 'empty'
        : 'grid';

  return (
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
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Aucun résultat</p>
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
        >
          {/* Hauteur totale calculée par le virtualiseur = espace réservé pour toutes les rangées */}
          <div
            ref={gridContainerRef}
            style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIdx = virtualRow.index * columns;
              const rowCards = filteredUsers.slice(startIdx, startIdx + columns);

              // Anime la rangée seulement si elle contient au moins une carte jamais vue
              const rowIsNew = rowCards.some((u) => !seenCardIds.has(u.id));
              rowCards.forEach((u) => seenCardIds.add(u.id));

              return (
                <motion.div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  initial={rowIsNew ? 'hidden' : false}
                  animate="show"
                  variants={rowStaggerVariants}
                  style={{
                    position: 'absolute',
                    top: virtualRow.start,
                    left: 0,
                    right: 0,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: `${GAP}px`,
                  }}
                >
                  {rowCards.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      isOwnProfile={loggedUsername === user.id}
                      isAdmin={isAdmin}
                      onEditPhoto={onEditPhoto}
                      onDeletePhoto={onDeletePhoto}
                    />
                  ))}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
