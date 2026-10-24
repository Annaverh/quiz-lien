const isTyping = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('input, textarea, select') !== null;

/** Document-level shortcut keys, ignored while typing or with modifier keys. Returns the cleanup. */
export function onKeys(handler: (event: KeyboardEvent) => void): () => void {
  const listener = (event: KeyboardEvent): void => {
    if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    handler(event);
  };
  document.addEventListener('keydown', listener);
  return () => document.removeEventListener('keydown', listener);
}

/**
 * Turns the space bar into a tap button while `isActive()`. Space normally activates the
 * focused button on keyup, so that is swallowed too and only the tap fires.
 */
export function bindSpaceTap(isActive: () => boolean, onTap: () => void): () => void {
  const applies = (event: KeyboardEvent): boolean => event.code === 'Space' && isActive() && !isTyping(event.target);
  const down = (event: KeyboardEvent): void => {
    if (!applies(event)) return;
    event.preventDefault();
    if (!event.repeat) onTap();
  };
  const up = (event: KeyboardEvent): void => {
    if (applies(event)) event.preventDefault();
  };
  document.addEventListener('keydown', down);
  document.addEventListener('keyup', up);
  return () => {
    document.removeEventListener('keydown', down);
    document.removeEventListener('keyup', up);
  };
}

/** Brief pressed look for a tap target. */
export function pulse(node: HTMLElement): void {
  node.classList.add('is-hit');
  setTimeout(() => node.classList.remove('is-hit'), 90);
}
