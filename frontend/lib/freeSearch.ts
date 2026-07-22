const STORAGE_KEY = 'cg_free_searches';
const FREE_LIMIT = 3;

export function getFreeSearchCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    return Math.max(0, parseInt(raw, 10) || 0);
  } catch {
    return 0;
  }
}

export function incrementFreeSearchCount(): number {
  const next = getFreeSearchCount() + 1;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {}
  return next;
}

export function resetFreeSearchCount(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getFreeSearchesRemaining(): number {
  return Math.max(0, FREE_LIMIT - getFreeSearchCount());
}

export function isFreeSearchLimitReached(): boolean {
  return getFreeSearchCount() >= FREE_LIMIT;
}

export { FREE_LIMIT };
