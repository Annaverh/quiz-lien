const TOAST_MS = 3800;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Shows a short message in the page's toast region (#toast). */
export function notify(message: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    toast.hidden = true;
  }, TOAST_MS);
}

export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
