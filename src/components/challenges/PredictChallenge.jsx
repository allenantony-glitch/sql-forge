import { useMemo } from 'react';
import { Check, ChevronUp, ChevronDown, X, Sparkles, Eraser } from 'lucide-react';
import { formatCell, isNumericColumn } from '../../utils/formatCell';
import { HighlightedSql } from '../../utils/highlight';

// ============================================================
// PREDICT — query card + ResultBuilder
// ============================================================

export function PredictQueryCard({ sql }) {
  return (
    <section className="rounded-lg border border-cyan-500/40 bg-stone-950/70 overflow-hidden mb-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
      <header className="px-3 py-2 border-b border-cyan-500/20 bg-cyan-500/5 flex items-center gap-2">
        <Sparkles size={12} className="text-cyan-300" />
        <span className="text-[10px] uppercase tracking-widest text-cyan-300">Read this query</span>
        <span className="text-[11px] text-stone-500 italic">execute it in your head — then build the result</span>
      </header>
      <pre
        className="px-4 py-3 m-0 text-sm leading-6 whitespace-pre-wrap break-words text-stone-200"
        style={{ fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}
      >
        <HighlightedSql text={sql} />
      </pre>
    </section>
  );
}

export function ResultBuilder({
  sourceColumns,
  sourceRows,
  builderCols,
  builderRowIdx,
  typedValues,
  computedColumns,
  onToggleColumn,
  onClearColumns,
  onRemoveRow,
  onMoveRow,
  onClearRows,
  onSetTypedCell,
  onCheck,
  status,
  feedback,
  disabled,
}) {
  const computedSet = useMemo(() => new Set(computedColumns || []), [computedColumns]);
  const isComputed = (c) => computedSet.has(c);
  const safeTyped = typedValues || [];
  const borderClass =
    status === "correct"
      ? "border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
      : status === "wrong"
      ? "border-rose-500/60 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]"
      : "border-cyan-500/40";

  const hasAnything = builderCols.length > 0 || builderRowIdx.length > 0;

  return (
    <section className={`rounded-lg border-2 ${borderClass} bg-stone-900/50 overflow-hidden transition-shadow`}>
      <header className="px-3 py-2 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-cyan-300">Result Builder</span>
          <span className="text-sm text-stone-200 font-medium">build the result by hand</span>
        </div>
        <span className="text-[11px] text-stone-500">
          {builderRowIdx.length} row{builderRowIdx.length === 1 ? "" : "s"} · {builderCols.length} col{builderCols.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="p-3 space-y-3">
        {/* Column picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">
              Columns · click to add, click again to remove
            </div>
            {builderCols.length > 0 && (
              <button
                onClick={onClearColumns}
                disabled={disabled}
                className="text-[10px] text-stone-500 hover:text-stone-300 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Eraser size={10} /> clear columns
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...sourceColumns, ...(computedColumns || [])].map((c) => {
              const orderIdx = builderCols.indexOf(c);
              const selected = orderIdx !== -1;
              const computed = isComputed(c);
              return (
                <button
                  key={c}
                  onClick={() => onToggleColumn(c)}
                  disabled={disabled}
                  className={[
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-colors select-none",
                    selected
                      ? "border-amber-400/70 bg-amber-500/15 text-amber-100"
                      : computed
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-200 hover:border-purple-400/70"
                      : "border-stone-700 bg-stone-900/60 text-stone-400 hover:border-cyan-400/50 hover:text-cyan-200",
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  title={
                    computed
                      ? `${selected ? "Remove" : "Add"} computed column (you'll type the values)`
                      : selected ? "Remove column" : "Add column"
                  }
                >
                  {selected && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/30 text-[9px] text-amber-100 font-semibold">
                      {orderIdx + 1}
                    </span>
                  )}
                  <span>{c}</span>
                  {computed && (
                    <span className="text-[9px] uppercase tracking-wider opacity-70">computed</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result grid */}
        <div className="rounded-md border border-cyan-500/30 bg-stone-950/60 overflow-hidden">
          {builderCols.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-stone-600 italic">
              Pick the columns the query returns by clicking the pills above.
            </div>
          ) : builderRowIdx.length === 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-stone-950">
                  {builderCols.map((c) => {
                    const num = isNumericColumn(sourceRows, c);
                    return (
                      <th
                        key={c}
                        className={`px-3 py-2 font-mono font-semibold text-amber-200/80 border-b border-cyan-500/20 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                      >
                        {c}
                      </th>
                    );
                  })}
                  <th className="w-20 border-b border-cyan-500/20" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-6 text-center text-xs text-stone-600 italic" colSpan={builderCols.length + 1}>
                    Now click rows in the source table to add them.
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-stone-950">
                    {builderCols.map((c) => {
                      const num = isNumericColumn(sourceRows, c);
                      return (
                        <th
                          key={c}
                          className={`px-3 py-2 font-mono font-semibold text-amber-200/80 border-b border-cyan-500/20 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                        >
                          {c}
                        </th>
                      );
                    })}
                    <th className="w-20 border-b border-cyan-500/20" />
                  </tr>
                </thead>
                <tbody>
                  {builderRowIdx.map((srcIdx, ri) => {
                    const row = sourceRows[srcIdx];
                    return (
                      <tr key={`${srcIdx}-${ri}`} className={ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}>
                        {builderCols.map((c) => {
                          const num = isNumericColumn(sourceRows, c);
                          if (isComputed(c)) {
                            const typed = (safeTyped[ri] && safeTyped[ri][c]) ?? "";
                            return (
                              <td
                                key={c}
                                className={`px-2 py-1 border-b border-cyan-500/15 align-middle ${num ? "text-right" : "text-left"}`}
                              >
                                <input
                                  type="text"
                                  value={typed}
                                  onChange={(e) => onSetTypedCell && onSetTypedCell(ri, c, e.target.value)}
                                  disabled={disabled}
                                  placeholder="type value"
                                  className={`w-full bg-stone-950/70 border border-purple-500/40 focus:border-purple-300/80 focus:outline-none rounded px-1.5 py-0.5 text-purple-100 placeholder:text-stone-600 font-mono text-[12px] ${num ? "text-right tabular-nums" : "text-left"}`}
                                />
                              </td>
                            );
                          }
                          const display = formatCell(row[c]);
                          return (
                            <td
                              key={c}
                              className={`px-3 py-1.5 border-b border-stone-800/50 align-middle ${num ? "text-right tabular-nums" : "text-left"}`}
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
                        <td className="px-2 py-1 border-b border-stone-800/50 align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => onMoveRow(ri, -1)}
                              disabled={disabled || ri === 0}
                              className="p-1 rounded text-stone-500 hover:text-cyan-300 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                              aria-label="Move up"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              onClick={() => onMoveRow(ri, 1)}
                              disabled={disabled || ri === builderRowIdx.length - 1}
                              className="p-1 rounded text-stone-500 hover:text-cyan-300 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                              aria-label="Move down"
                            >
                              <ChevronDown size={12} />
                            </button>
                            <button
                              onClick={() => onRemoveRow(ri)}
                              disabled={disabled}
                              className="p-1 rounded text-stone-500 hover:text-rose-300 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Remove from result"
                              aria-label="Remove row"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between gap-2">
          <div>
            {builderRowIdx.length > 0 && (
              <button
                onClick={onClearRows}
                disabled={disabled}
                className="text-[10px] text-stone-500 hover:text-stone-300 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Eraser size={10} /> clear rows
              </button>
            )}
          </div>
          <button
            onClick={onCheck}
            disabled={disabled || !hasAnything}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
          >
            <Check size={12} /> Check Result
          </button>
        </div>

        {/* Granular feedback */}
        {feedback && !feedback.ok && (
          <div className="rounded-md border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-xs text-rose-200 space-y-1">
            <div className="font-semibold text-rose-200">{feedback.message}</div>
            {feedback.kind === "wrong_columns" && (
              <div className="text-rose-300/90">
                {feedback.missingColumns?.length > 0 && (
                  <div>Missing: <span className="font-mono text-amber-200">{feedback.missingColumns.join(", ")}</span></div>
                )}
                {feedback.extraColumns?.length > 0 && (
                  <div>Shouldn't be here: <span className="font-mono text-rose-200">{feedback.extraColumns.join(", ")}</span></div>
                )}
              </div>
            )}
            {feedback.kind === "wrong_column_order" && (
              <div className="text-rose-300/90">
                Expected order: <span className="font-mono text-amber-200">{feedback.expectedColumns.join(", ")}</span>
              </div>
            )}
            {feedback.kind === "wrong_rows" && (
              <div className="text-rose-300/90 italic">
                Walk through the WHERE clause row by row — which source rows actually pass it?
              </div>
            )}
            {feedback.kind === "wrong_row_order" && (
              <div className="text-rose-300/90 italic">
                Use the ↑↓ arrows on each row to fix the order.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
