// Cache en mémoire : URL src → Object URL (blob local)
export const imageCache = new Map<string, string>();

export function clearImageCache(src?: string) {
  if (src) {
    const objectUrl = imageCache.get(src);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    imageCache.delete(src);
  } else {
    imageCache.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    imageCache.clear();
  }
}
