# Real-song recordings

Put one MP3 per song in this folder (`src/assets/audio/`), named after the song id. The build gives each file a content-hashed URL, so a changed clip is never served from a stale browser cache:

| Song                              | File                     |
| --------------------------------- | ------------------------ |
| Wonderwall                        | `wonderwall.mp3`         |
| Good Riddance (Time of Your Life) | `good-riddance.mp3`      |
| Knockin' on Heaven's Door         | `knockin.mp3`            |
| House of the Rising Sun           | `rising-sun.mp3`         |
| Dust in the Wind                  | `dust-wind.mp3`          |
| Riptide                           | `riptide.mp3`            |
| Perfect                           | `perfect.mp3`            |
| Let Her Go                        | `let-her-go.mp3`         |
| A Horse with No Name              | `horse.mp3`              |
| Wish You Were Here                | `wish-you-were-here.mp3` |
| Landslide                         | `landslide.mp3`          |
| Hallelujah                        | `hallelujah.mp3`         |
| I'm Yours                         | `im-yours.mp3`           |
| Hey There Delilah                 | `delilah.mp3`            |
| Fast Car                          | `fast-car.mp3`           |

Each file must also be listed in `TRACKS` in [`src/tracks/manifest.ts`](../../tracks/manifest.ts), for example:

```js
'wonderwall': { file: 'wonderwall.mp3', start: 0 },
```

`start` is the second in the file where the song's first chord begins (Em7 for Wonderwall).
To find it (and the exact tempo), open the song's study page ("Oefenen"), open
"Origineel gelijkzetten (voor docenten)", tap along, then use "Kopieer timing" and paste the
line into `TRACKS`.

Tips:

- Short clips (30–60 s around the part that is played) load much faster than whole songs.
  Each file must be under 15 MB.
- The app plays the songs in the record's key using a capo where needed. If a recording
  sounds out of tune with the app guitar, it may be tuned differently from standard tuning.
- Only use recordings you have the right to share with the people you give the link to.
