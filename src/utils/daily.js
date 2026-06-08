// ============================================================
// DAILY FORGE — deterministic-by-date challenge picker + streak math.
// ============================================================

// YYYY-MM-DD in local time. Picked locally rather than UTC so a learner who
// plays at 11pm and then at 1am sees the streak advance only once per local day.
export function todayDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// FNV-1a 32-bit hash — fast, deterministic, good enough for "spread a date
// across a fixed list of challenges." Don't reach for Math.random anywhere
// in this file: the daily must be the same for every learner across a day.
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Pick an item from `items` deterministically from the given date string.
// Returns null if the list is empty.
export function pickForDate(items, dateString) {
  if (!items || items.length === 0) return null;
  const idx = hashStr(dateString) % items.length;
  return items[idx];
}

// Update the streak counter after the learner completes today's daily.
// Rules:
//   - first completion ever → streak = 1
//   - completed yesterday → streak + 1
//   - missed a day or more → streak reset to 1
//   - already done today → unchanged
export function updateStreak(prev, todayStr) {
  const prevDays = (prev && typeof prev.streakDays === "number") ? prev.streakDays : 0;
  const prevDate = prev && prev.lastDailyDate;
  if (prevDate === todayStr) {
    return { streakDays: prevDays, lastDailyDate: prevDate };
  }
  if (!prevDate) {
    return { streakDays: 1, lastDailyDate: todayStr };
  }
  // Compute calendar-day gap.
  const a = Date.parse(prevDate + "T00:00:00");
  const b = Date.parse(todayStr + "T00:00:00");
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return { streakDays: 1, lastDailyDate: todayStr };
  }
  const days = Math.round((b - a) / (24 * 60 * 60 * 1000));
  if (days === 1) {
    return { streakDays: prevDays + 1, lastDailyDate: todayStr };
  }
  return { streakDays: 1, lastDailyDate: todayStr };
}
