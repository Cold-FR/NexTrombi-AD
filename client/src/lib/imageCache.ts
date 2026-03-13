// Cache LRU : max MAX_SIZE entrées — les plus anciennes sont révoquées automatiquement
const MAX_CACHE_SIZE = 80;

class LRUImageCache {
  private cache = new Map<string, string>();

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value === undefined) return undefined;
    // Déplacer en fin de Map = marquer comme "récemment utilisé"
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: string, value: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= MAX_CACHE_SIZE) {
      // Évincer le moins récemment utilisé (premier de la Map) et révoquer son blob
      const lruKey = this.cache.keys().next().value!;
      URL.revokeObjectURL(this.cache.get(lruKey)!);
      this.cache.delete(lruKey);
    }
    this.cache.set(key, value);
  }

  delete(key: string): void {
    const value = this.cache.get(key);
    if (value !== undefined) {
      URL.revokeObjectURL(value);
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    this.cache.clear();
  }
}

export const imageCache = new LRUImageCache();

export function clearImageCache(src?: string) {
  if (src) {
    imageCache.delete(src);
  } else {
    imageCache.clear();
  }
}
