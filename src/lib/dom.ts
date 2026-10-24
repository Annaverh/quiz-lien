export type Child = Node | string | number | boolean | null | undefined | readonly Child[];
export type Props = Record<string, unknown>;

/** Creates an HTML element. `onClick`-style props become listeners; known DOM properties are assigned. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  applyProps(node, props);
  appendChildren(node, children);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  applyProps(node, props);
  appendChildren(node, children);
  return node;
}

function applyProps(node: HTMLElement | SVGElement, props: Props): void {
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.setAttribute('class', String(value));
    else if (key === 'style') node.style.cssText = String(value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key in node && !(node instanceof SVGElement)) {
      (node as unknown as Record<string, unknown>)[key] = value;
    } else node.setAttribute(key, value === true ? '' : String(value));
  }
}

export function appendChildren(node: Element, children: readonly Child[]): void {
  for (const child of children) {
    if (child == null || typeof child === 'boolean') continue;
    if (isChildList(child)) appendChildren(node, child);
    else node.append(child instanceof Node ? child : String(child));
  }
}

const isChildList = (child: Child): child is readonly Child[] => Array.isArray(child);

let uid = 0;
/** Unique ids for label/input pairs and radio groups. */
export const nextId = (prefix: string): string => `${prefix}-${++uid}`;
