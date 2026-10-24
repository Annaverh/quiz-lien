/**
 * localStorage can be missing or throw (private windows, blocked storage, tests).
 * Everything stored here is a convenience, so failures fall back silently.
 */
export const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable: the value simply isn't remembered.
    }
  },
};
