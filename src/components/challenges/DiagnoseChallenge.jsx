import { useMemo } from 'react';
import { Check, X, AlertTriangle, Stethoscope } from 'lucide-react';
import { executeQuery } from '../../engine/executor';
import { TABLES } from '../../data/shows';
import { HighlightedSql } from '../../utils/highlight';
import { formatCell, isNumericColumn } from '../../utils/formatCell';
import { DataTable } from '../DataTable';

// ============================================================
// DIAGNOSE — broken query + wrong/expected + diagnostic options
// ============================================================

export function DiagnoseOption({ opt, isSelected, status, isCorrect, onSelect, disabled }) {
  // Visual state:
  //   - idle/unselected: stone border
  //   - idle/selected: cyan border + filled radio
  //   - after correct submit: correct = emerald border + check; wrong-selected = rose border + x
  //   - after wrong submit: selected wrong = rose border + x
  let optClass;
  let circleClass;
  let circleInner = null;
  let trailingIcon = null;

  if (status === "correct") {
    if (isCorrect) {
      optClass = "border-emerald-500/70 bg-emerald-950/20";
      circleClass = "border-emerald-400 bg-emerald-400";
      circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
      trailingIcon = <Check size={14} className="text-emerald-300" />;
    } else if (isSelected) {
      optClass = "border-rose-500/70 bg-rose-950/20";
      circleClass = "border-rose-400 bg-rose-400";
      circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
      trailingIcon = <X size={14} className="text-rose-300" />;
    } else {
      optClass = "border-stone-800 bg-stone-950/40 opacity-60";
      circleClass = "border-stone-600";
    }
  } else if (status === "wrong" && isSelected) {
    optClass = "border-rose-500/70 bg-rose-950/20";
    circleClass = "border-rose-400 bg-rose-400";
    circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
    trailingIcon = <X size={14} className="text-rose-300" />;
  } else if (isSelected) {
    optClass = "border-cyan-400/70 bg-cyan-500/10";
    circleClass = "border-cyan-400 bg-cyan-400";
    circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
  } else {
    optClass = "border-stone-700 bg-stone-950/40 hover:border-cyan-500/40 hover:bg-stone-900/70";
    circleClass = "border-stone-600";
  }

  return (
    <button
      onClick={() => !disabled && onSelect(opt.id)}
      disabled={disabled}
      className={`w-full text-left rounded-md border-2 px-3 py-2.5 flex items-start gap-3 transition-colors ${optClass} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 ${circleClass}`}>
        {circleInner}
      </span>
      <span className="text-sm text-stone-200 leading-relaxed flex-1">{opt.text}</span>
      {trailingIcon && <span className="shrink-0 mt-0.5">{trailingIcon}</span>}
    </button>
  );
}

export function DiagnoseChallenge({
  challenge,
  sourceTables,
  selectedId,
  onSelect,
  onDiagnose,
  status,
}) {
  const brokenResult = useMemo(() => {
    try {
      return { result: executeQuery(challenge.brokenSql, TABLES), error: null };
    } catch (e) {
      return { result: null, error: e.message || String(e) };
    }
  }, [challenge.brokenSql]);

  const expected = useMemo(() => {
    try {
      return executeQuery(challenge.targetSql, TABLES);
    } catch {
      return { columns: [], rows: [] };
    }
  }, [challenge.targetSql]);

  const locked = status === "correct";
  const optionsBorder =
    status === "correct"
      ? "border-emerald-500/60 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
      : status === "wrong"
      ? "border-rose-500/60 sf-shake"
      : "border-stone-800";

  return (
    <>
      {/* Broken SQL — rose-themed card */}
      <section className="rounded-lg border border-rose-500/40 bg-rose-950/20 overflow-hidden mb-4 shadow-[0_0_0_1px_rgba(244,63,94,0.08)]">
        <header className="px-3 py-2 border-b border-rose-500/30 bg-rose-500/5 flex items-center gap-2">
          <AlertTriangle size={12} className="text-rose-300" />
          <span className="text-[10px] uppercase tracking-widest text-rose-300">Broken Query</span>
          <span className="text-[11px] text-stone-500 italic">this query produces the wrong result — figure out why</span>
        </header>
        <pre
          className="px-4 py-3 m-0 text-sm leading-6 whitespace-pre-wrap break-words text-stone-200"
          style={{ fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}
        >
          <HighlightedSql text={challenge.brokenSql} />
        </pre>
      </section>

      {/* Source tables — full width above the comparison. Multi-table diagnose
          challenges (e.g. shows + episodes) need every referenced table visible
          so the learner can reason about which columns belong where. */}
      <div className={`mb-4 grid grid-cols-1 ${sourceTables.length > 1 ? "lg:grid-cols-2" : ""} gap-3`}>
        {sourceTables.map((t) => (
          <DataTable
            key={t.name}
            title={t.name}
            columns={t.columns}
            rows={t.rows}
            variant="source"
            maxHeight="max-h-64"
          />
        ))}
      </div>

      {/* Wrong + Expected side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {brokenResult.error ? (
          <section className="rounded-lg border border-rose-500/50 bg-rose-950/10 overflow-hidden">
            <header className="px-3 py-2 border-b border-rose-500/30 bg-rose-500/5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-rose-300">Wrong Result</span>
              <span className="text-sm text-stone-200 font-medium">query errored</span>
            </header>
            <div className="px-3 py-4 text-sm text-rose-200">
              <span className="font-semibold">Query Error:</span> {brokenResult.error}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-rose-500/50 bg-rose-950/10 overflow-hidden">
            <header className="px-3 py-2 flex items-center justify-between border-b border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-rose-300">Wrong Result</span>
                <span className="text-sm text-stone-200 font-medium">what the broken query returns</span>
              </div>
              <span className="text-[11px] text-stone-500">
                {brokenResult.result.rows.length} row{brokenResult.result.rows.length === 1 ? "" : "s"} · {brokenResult.result.columns.length} col{brokenResult.result.columns.length === 1 ? "" : "s"}
              </span>
            </header>
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-stone-950">
                    {brokenResult.result.columns.map((c) => {
                      const num = isNumericColumn(brokenResult.result.rows, c);
                      return (
                        <th
                          key={c}
                          className={`px-3 py-2 font-mono font-semibold text-rose-200/80 border-b border-rose-500/20 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                        >
                          {c}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {brokenResult.result.rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-stone-600 italic" colSpan={Math.max(brokenResult.result.columns.length, 1)}>
                        (no rows)
                      </td>
                    </tr>
                  )}
                  {brokenResult.result.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}>
                      {brokenResult.result.columns.map((c) => {
                        const num = isNumericColumn(brokenResult.result.rows, c);
                        const display = formatCell(row[c]);
                        return (
                          <td
                            key={c}
                            className={`px-3 py-1.5 border-b border-stone-800/50 align-top ${num ? "text-right tabular-nums" : "text-left"}`}
                          >
                            {display === null ? (
                              <span className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle" title="NULL" />
                            ) : (
                              <span className="text-stone-200 whitespace-pre">{display}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <DataTable
          title="expected result"
          columns={expected.columns}
          rows={expected.rows}
          variant="target"
          maxHeight="max-h-64"
        />
      </div>

      {/* Diagnostic options */}
      <section className={`rounded-lg border-2 ${optionsBorder} bg-stone-900/50 p-3 mb-4 transition-shadow`}>
        <header className="mb-3 flex items-center gap-2">
          <Stethoscope size={14} className="text-cyan-300" />
          <span className="text-[10px] uppercase tracking-widest text-cyan-300">Diagnosis</span>
          <span className="text-sm text-stone-200 font-medium">what's wrong with this query?</span>
        </header>
        <div className="space-y-2">
          {challenge.options.map((opt) => (
            <DiagnoseOption
              key={opt.id}
              opt={opt}
              isSelected={selectedId === opt.id}
              isCorrect={opt.id === challenge.correctOption}
              status={status}
              onSelect={onSelect}
              disabled={locked}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] italic min-h-[1.25rem]">
            {status === "wrong" && (
              <span className="text-rose-300">
                Not quite — think about WHEN in the execution order each clause runs.
              </span>
            )}
          </div>
          <button
            onClick={onDiagnose}
            disabled={!selectedId || locked}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
          >
            <Stethoscope size={12} /> Diagnose
          </button>
        </div>
      </section>
    </>
  );
}
