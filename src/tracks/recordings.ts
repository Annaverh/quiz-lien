/**
 * The bundled recordings (src/assets/audio/*.mp3). Vite gives every file a content-hashed
 * URL, so a re-cut clip always gets a new address and can never be served from a stale cache.
 */
const URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/audio/*.mp3', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url]),
);

/** URL of a bundled recording by file name, or null when there is no such file. */
export const recordingUrl = (file: string): string | null => URLS[file] ?? null;
