// ============================================================
// PERSISTENCE — localStorage. Guarded so SSR / non-browser builds
// still load without throwing.
// ============================================================

const STORAGE_KEY = "sql-forge-state";

// Bump when the persisted-state shape changes in a way old saves can't migrate
// into. On mismatch, loadState() returns null and the app starts fresh rather
// than reading half-defined fields.
export const SCHEMA_VERSION = 2;

export function storageAvailable() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    // Some private-browsing modes expose localStorage but throw on setItem.
    const probe = "__sf_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function saveState(state) {
  if (!storageAvailable()) return false;
  try {
    const payload = { v: SCHEMA_VERSION, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    // Quota exceeded, etc. The session keeps working; persistence just stalls.
    console.error("Storage save failed:", e);
    return false;
  }
}

export function loadState() {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    if (data.v !== SCHEMA_VERSION) return null; // schema bump → start clean
    return data;
  } catch (e) {
    console.error("Storage load failed:", e);
    return null;
  }
}

export function clearState() {
  if (!storageAvailable()) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
