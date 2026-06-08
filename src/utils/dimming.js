// ============================================================
// GEM DIMMING — spaced-repetition timer math.
//
// On app load we walk every gem and drop its level based on how long since
// lastUsed. Levels never fall below 1 once earned (the concept was learned,
// it just needs refreshing). A gem dropped any levels is "dimming" and shows
// a gentle pulse in the belt.
// ============================================================

export const DIM_THRESHOLDS_DAYS = [3, 5, 7, 14];

function msPerDay() { return 24 * 60 * 60 * 1000; }

export function daysSince(iso, nowMs) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (nowMs - t) / msPerDay());
}

// Compute how many levels a gem should drop given the days since last use.
//   ≥ 3d  → drop 1
//   ≥ 5d  → drop 2
//   ≥ 7d  → drop 3
//   ≥ 14d → drop to floor (level 1)
// Returns 0 if untouched (no time pressure yet).
export function dropLevelsFor(days) {
  if (days == null) return 0;
  if (days >= DIM_THRESHOLDS_DAYS[3]) return 99; // collapse to floor
  if (days >= DIM_THRESHOLDS_DAYS[2]) return 3;
  if (days >= DIM_THRESHOLDS_DAYS[1]) return 2;
  if (days >= DIM_THRESHOLDS_DAYS[0]) return 1;
  return 0;
}

// Apply dimming to a single gem's stored level. Once earned (originalLevel ≥ 1)
// the floor is 1 — we never drop to unlit. Untouched gems (level 0) stay 0.
export function applyDimming(originalLevel, daysIdle) {
  if (originalLevel <= 0) return 0;
  const drop = dropLevelsFor(daysIdle);
  if (drop === 0) return originalLevel;
  return Math.max(1, originalLevel - drop);
}

// Convenience: walk a gem map of the form `{ id: { level, lastUsed } }` and
// return the current effective level for each gem after dimming, plus a flag
// telling us whether each gem is currently dimmed (so the UI can pulse it).
export function computeGemDisplay(gemState, nowMs) {
  const display = {};
  for (const [id, entry] of Object.entries(gemState || {})) {
    const stored = (entry && entry.level) || 0;
    const days = entry ? daysSince(entry.lastUsed, nowMs) : null;
    const current = applyDimming(stored, days);
    display[id] = {
      level: current,
      storedLevel: stored,
      dimming: current < stored,
      daysSinceUse: days,
    };
  }
  return display;
}
