import { useState, useEffect, useRef } from 'react';
import { type User } from '../components/UserCard';

const PAGE_SIZE = 24;

export function useInfiniteScroll(filteredUsers: User[], searchTerm: string) {
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset quand la recherche change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayedCount(PAGE_SIZE);
  }, [searchTerm]);

  // IntersectionObserver
  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [filteredUsers.length]);

  const visibleUsers = filteredUsers.slice(0, displayedCount);
  const hasMore = displayedCount < filteredUsers.length;

  return { visibleUsers, hasMore, observerTarget };
}
