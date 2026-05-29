// FADED TARGET — progressive scaffolding for the target table. The learner
// sees the shape (cols/rows/headers/sort) but values are dimmed placeholders,
// so they can't pattern-match against expected values. Levels:
//   "full"     → render as a normal DataTable (caller handles this)
//   "labeled"  → headers visible, row count visible, cells are "—"
//   "shape"    → headers hidden (col_1, col_2…), row count visible, cells "—"
//   "rowcount" → just "Expected: N rows", no table
//   "none"     → renders nothing
export function FadedTarget({ columns, rows, fadeLevel }) {
  if (fadeLevel === "none") return null;

  if (fadeLevel === "rowcount") {
    return (
      <section className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-6 flex items-center justify-center min-h-[120px]">
        <span className="text-stone-400 text-sm">
          Expected result:{" "}
          <span className="text-amber-200 font-semibold">
            {rows.length} row{rows.length === 1 ? "" : "s"}
          </span>
        </span>
      </section>
    );
  }

  const showHeaders = fadeLevel !== "shape";
  const displayColumns = showHeaders
    ? columns
    : columns.map((_, i) => `col_${i + 1}`);
  const fadedRows = rows.map(() => {
    const o = {};
    for (const c of displayColumns) o[c] = "—";
    return o;
  });

  return (
    <section className="rounded-lg border border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.15)] bg-stone-900/50 overflow-hidden">
      <header className="px-3 py-2 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-amber-300">
            Target (faded)
          </span>
          <span className="text-sm text-stone-200 font-medium">expected result</span>
          <span className="text-[10px] text-amber-300/80 italic ml-1">
            trust your instinct
          </span>
        </div>
        <span className="text-[11px] text-stone-500">
          {rows.length} row{rows.length === 1 ? "" : "s"} · {displayColumns.length} col{displayColumns.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className="overflow-auto max-h-72">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-stone-950">
              {displayColumns.map((c) => (
                <th
                  key={c}
                  className={`px-3 py-2 font-mono font-semibold border-b border-stone-800 whitespace-nowrap text-left ${
                    showHeaders ? "text-stone-400" : "text-stone-700 italic"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fadedRows.map((_, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}>
                {displayColumns.map((c) => (
                  <td
                    key={c}
                    className="px-3 py-1.5 border-b border-stone-800/50 align-middle text-left text-stone-600"
                  >
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
