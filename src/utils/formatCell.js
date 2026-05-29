export function formatCell(value) {
  if (value == null) return null; // sentinel for NULL rendering
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    // Show the real value, trimmed to at most 6 decimals with trailing zeros
    // removed. The previous fixed-1-decimal formatting collapsed AVG-style
    // results like 8.8533… into "8.9", making them visually indistinguishable
    // from the rounded expected output even when the comparison failed.
    return parseFloat(value.toFixed(6)).toString();
  }
  return String(value);
}

export function isNumericColumn(rows, col) {
  for (const r of rows) {
    if (r[col] != null) return typeof r[col] === "number";
  }
  return false;
}
