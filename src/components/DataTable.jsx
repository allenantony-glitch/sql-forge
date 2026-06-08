import { useMemo } from 'react';
import { formatCell, isNumericColumn } from '../utils/formatCell';

export function DataTable({
  title,
  columns,
  rows,
  variant = "source",
  maxHeight = "max-h-72",
  selectedRowIndices = null,
  onRowClick = null,
}) {
  const isTarget = variant === "target";
  const clickable = typeof onRowClick === "function";
  const selectedSet = useMemo(() => {
    if (!selectedRowIndices) return null;
    return selectedRowIndices instanceof Set ? selectedRowIndices : new Set(selectedRowIndices);
  }, [selectedRowIndices]);

  return (
    <section
      className={`rounded-lg border ${isTarget ? "border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]" : "border-stone-800"} bg-stone-900/50 overflow-hidden`}
    >
      <header className={`px-3 py-2 flex items-center justify-between border-b ${isTarget ? "border-amber-500/30 bg-amber-500/5" : "border-stone-800 bg-stone-900/80"}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-widest ${isTarget ? "text-amber-300" : "text-stone-500"}`}>
            {isTarget ? "Target" : "Source"}
          </span>
          <span className="text-sm text-stone-200 font-medium">{title}</span>
          {clickable && (
            <span className="text-[10px] text-cyan-300/80 italic ml-1">click rows to pick</span>
          )}
        </div>
        <span className="text-[11px] text-stone-500">
          {rows.length} row{rows.length === 1 ? "" : "s"} · {columns.length} col{columns.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className={`overflow-x-auto overflow-y-auto ${maxHeight}`}>
        <table className="w-full text-xs border-collapse min-w-max">
          <thead className="sticky top-0">
            <tr className="bg-stone-950">
              {columns.map((c) => {
                const num = isNumericColumn(rows, c);
                return (
                  <th
                    key={c}
                    className={`px-3 py-2 font-mono font-semibold text-stone-400 border-b border-stone-800 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                  >
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-stone-600 italic" colSpan={columns.length || 1}>
                  (no rows)
                </td>
              </tr>
            )}
            {rows.map((row, ri) => {
              const selected = selectedSet ? selectedSet.has(ri) : false;
              const baseBg = ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20";
              const rowClass = [
                baseBg,
                clickable ? "cursor-pointer hover:bg-cyan-500/10 transition-colors" : "",
                selected ? "ring-1 ring-amber-400/40" : "",
              ].join(" ");
              return (
                <tr
                  key={ri}
                  className={rowClass}
                  onClick={clickable ? () => onRowClick(ri) : undefined}
                  style={selected ? { boxShadow: "inset 4px 0 0 0 rgb(251,191,36)" } : undefined}
                >
                  {columns.map((c) => {
                    const v = row[c];
                    const num = isNumericColumn(rows, c);
                    const display = formatCell(v);
                    return (
                      <td
                        key={c}
                        className={`px-3 py-1.5 border-b border-stone-800/50 align-top ${num ? "text-right tabular-nums" : "text-left"}`}
                      >
                        {display === null ? (
                          <span
                            className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle"
                            title="NULL"
                          />
                        ) : (
                          <span className="text-stone-200 whitespace-pre">{display}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
