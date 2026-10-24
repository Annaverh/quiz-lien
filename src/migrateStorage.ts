import { storage } from './lib/storage';

/**
 * The app was first published as "strum-pick-change". Carries over what returning visitors
 * saved under the old keys. Imported first in main.ts, before any module reads storage.
 */
for (const key of ['v1', 'timing/v1', 'mix/v1']) storage.migrate(`strum-pick-change/${key}`, `quiz-lien/${key}`);
