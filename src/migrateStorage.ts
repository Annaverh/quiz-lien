import { storage } from './lib/storage';

/**
 * The app was first published as "strum-pick-change". Carries over what returning visitors
 * saved under the old keys. Imported first in main.ts, before any module reads storage.
 */
for (const key of ['v1', 'mix/v1']) storage.migrate(`strum-pick-change/${key}`, `quiz-lien/${key}`);

// Timing saved in the browser points at the clips of its day; every re-cut bumps the version
// (see TIMING_KEY in tracks/timing.ts), and older versions are dropped here.
const STALE_TIMINGS = [
  'strum-pick-change/timing/v1',
  'quiz-lien/timing/v1',
  'quiz-lien/timing/v2',
  'quiz-lien/timing/v3',
  'quiz-lien/timing/v4',
];
for (const key of STALE_TIMINGS) storage.remove(key);
