import { svgEl } from '../../lib/dom';
import { chordFor, type ChordName } from '../../music/chords';
import { MUTED } from '../../music/constants';

const LEFT = 9;
const TOP = 16;
const STRING_GAP = 8;
const FRET_GAP = 13;
const FRETS_SHOWN = 4;

/** A small chord box: strings vertical, frets horizontal, × for muted and ○ for open strings. */
export function chordDiagram(name: ChordName): SVGSVGElement {
  const { frets } = chordFor(name);
  const width = STRING_GAP * 5;
  const parts: SVGElement[] = [];

  for (let s = 0; s < 6; s++) {
    const x = LEFT + s * STRING_GAP;
    parts.push(svgEl('line', { class: 'grid', x1: x, x2: x, y1: TOP, y2: TOP + FRET_GAP * FRETS_SHOWN }));
  }
  for (let f = 1; f <= FRETS_SHOWN; f++) {
    const y = TOP + f * FRET_GAP;
    parts.push(svgEl('line', { class: 'grid', x1: LEFT, x2: LEFT + width, y1: y, y2: y }));
  }
  parts.push(svgEl('line', { class: 'nut', x1: LEFT - 0.5, x2: LEFT + width + 0.5, y1: TOP, y2: TOP }));

  frets.forEach((fret, s) => {
    const x = LEFT + s * STRING_GAP;
    if (fret === MUTED) parts.push(svgEl('text', { x, y: TOP - 5 }, '×'));
    else if (fret === 0) parts.push(svgEl('circle', { class: 'grid', cx: x, cy: TOP - 7, r: 2.6 }));
    else parts.push(svgEl('circle', { class: 'dot', cx: x, cy: TOP + (fret - 0.5) * FRET_GAP, r: 3.4 }));
  });

  return svgEl(
    'svg',
    { class: 'diagram', viewBox: '0 0 58 72', role: 'img', 'aria-label': `${name} chord shape` },
    parts,
  );
}
