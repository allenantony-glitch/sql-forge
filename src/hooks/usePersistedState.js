// ============================================================
// PERSISTENCE — localStorage. Guarded so SSR / non-browser builds
// still load without throwing.
// ============================================================

const STORAGE_KEY = "sql-forge-state";

export function storageAvailable() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function saveState(state) {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Storage save failed:", e);
  }
}

export function loadState() {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Storage load failed:", e);
    return null;
  }
}
