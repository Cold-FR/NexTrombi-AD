import { Loader2 } from 'lucide-react';
import UserCard, { type User } from './UserCard';

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
  // Chargement initial
  if (allUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 size={48} className="text-primary-600 mb-4 animate-spin" />
        <p>Chargement de l'annuaire...</p>
      </div>
    );
  }

  // Aucun résultat de recherche
  if (filteredCount === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        Aucun collaborateur trouvé pour cette recherche.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visibleUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isAdmin={isAdmin}
            onEditPhoto={onEditPhoto}
            onDeletePhoto={onDeletePhoto}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="mt-4 flex w-full justify-center py-10">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      )}
    </>
  );
}
