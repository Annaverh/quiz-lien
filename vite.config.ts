import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths, so the build works from any folder or a GitHub Pages sub-path.
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
