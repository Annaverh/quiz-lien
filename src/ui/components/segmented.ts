import { el, nextId } from '../../lib/dom';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** A pill-shaped radio group. */
export function segmented<T extends string>(
  options: readonly SegmentOption<T>[],
  value: T,
  onChange: (value: T) => void,
): HTMLElement {
  const name = nextId('seg');
  return el(
    'div',
    { class: 'seg', role: 'radiogroup' },
    options.map(option =>
      el(
        'label',
        {},
        el('input', {
          type: 'radio',
          name,
          value: option.value,
          checked: option.value === value,
          onChange: () => onChange(option.value),
        }),
        el('span', {}, option.label),
      ),
    ),
  );
}

export type TempoValue = '0.5' | '0.75' | '1';

export const TEMPO_OPTIONS: readonly SegmentOption<TempoValue>[] = [
  { value: '0.5', label: 'Langzaam' },
  { value: '0.75', label: 'Gemiddeld' },
  { value: '1', label: 'Normaal' },
];

/** A labelled group: "Tempo [Langzaam | Gemiddeld | Normaal]". */
export const controlGroup = (label: string, control: Node): HTMLElement =>
  el('div', { class: 'control-group' }, el('span', { class: 'seg-label' }, label), control);
