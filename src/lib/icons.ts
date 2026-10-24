import { svgEl } from './dom';

const ICON_PATHS = {
  play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z',
  stop: 'M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  back: 'M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export const icon = (name: IconName): SVGSVGElement =>
  svgEl('svg', { viewBox: '0 0 24 24', class: 'icon', 'aria-hidden': 'true' }, svgEl('path', { d: ICON_PATHS[name] }));
