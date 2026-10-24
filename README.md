# Quiz Lien

A free ear-training quiz for beginner guitar players. The interface is in Dutch. Learners
hear a short fragment of a well-known song and answer one of two kinds of question:

- **Slaan of tokkelen?** Is the guitar strummed or picked? After answering, an interactive
  tab shows the exact pattern; it can be looped, slowed down, compared with the other style,
  and clicked step by step.
- **Hoor de wissel.** Tap along (or press the space bar) on the beats where a new chord
  starts. Afterwards the beat grid shows every chord, with change bells, chord diagrams and
  tips on what to listen for.

Every guitar sound is synthesised in the browser (Karplus–Strong plucked strings), so the
app needs no samples, accounts or server. Optionally, a recording of the real song can play
underneath at song speed, with its own volume slider.

## Getting started

Requires Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script            | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                            |
| `npm run build`   | Type-checks, then builds a static site into `dist/`   |
| `npm run preview` | Serves the production build                           |
| `npm test`        | Unit tests (Vitest)                                   |
| `npm run lint`    | ESLint                                                |
| `npm run format`  | Prettier                                              |
| `npm run check`   | Everything CI runs: types, lint, formatting and tests |

## Project layout

```
src/
  main.ts                 Entry point: styles, data validation, app start
  migrateStorage.ts       Moves values saved under the app's old storage keys
  lib/                    Small framework-free helpers (DOM builder, storage, PRNG, toast)
  music/                  Pure music model — no DOM, no audio
    chords.ts             Chord shapes
    songs.ts              Song library (progression, pattern, tempo, capo, teaching text)
    patterns.ts           Fallback patterns and count labels
    voicing.ts            Which strings a strum or pick step sounds
    arrangement.ts        Song + options → timed note events, steps and chord changes
    validate.ts           Checks song data the type system can't
  audio/                  Web Audio playback
    synthesis.ts          Plucked-string synthesis, room reverb, count-in blips
    engine.ts             Mixes the guitar and an optional recording; one playback at a time
    playback.ts           A running fragment: step reporting and clean stopping
  tracks/                 Real-song recordings
    manifest.ts           Which recordings exist, and where each fragment starts
    timing.ts             Timing overrides, tap-tempo fitting, record-tempo arrangements
    mix.ts                Shared real-song volume
  quiz/                   Rounds, question selection, scoring and saved stats
  ui/
    app.ts                Navigation and the current round
    components/           Play button, interactive tab, beat grid, mixer, sync tool…
    views/                Home, the two question types, summary and study pages
  styles/                 CSS split by area; design tokens in tokens.css
public/
  audio/                  Recordings of the real songs (see its README)
```

Dependencies only point downward: `ui` → `quiz`, `tracks`, `audio` → `music` → `lib`.
The `music` and `quiz` layers are pure and fully unit-tested.

## Adding a song

1. Add any new chord shapes to `src/music/chords.ts`.
2. Add the song to `SONG_DEFINITIONS` in `src/music/songs.ts`. The pattern is one bar long:
   for strumming use `'D'`, `'U'` and `REST`; for picking use `'B'` (bass string), `'A'`
   (alternate bass), a string index `0`–`5` (0 = low E), or an array for a pinch.
3. Run `npm test`. The library test catches patterns of the wrong length, half-filled bars
   and picks that land on a muted string.

## Adding a real recording

See [`public/audio/README.md`](public/audio/README.md). In short: put the MP3 in
`public/audio/`, list it in `src/tracks/manifest.ts`, then use **Origineel gelijkzetten**
on the song's study page to find where the fragment starts and copy the line into the
manifest. Only publish recordings you have the right to share.

## Deploying for free

The build is a static site with relative paths, so any static host works.
`.github/workflows/deploy.yml` publishes to **GitHub Pages** on every push to `main`
(enable Pages with "GitHub Actions" as the source in the repository settings).
`.github/workflows/ci.yml` runs the full check on every push and pull request.
