import { useState, useMemo, useEffect } from 'react';
import { evalExpr, evalHaving } from '../engine/executor';
import { formatCell, isNumericColumn } from '../utils/formatCell';
import { TABLES } from '../data/shows';

// ============================================================
// ANIMATION STAGE
// Plays the WHERE → SELECT → ORDER BY → LIMIT transformation
// on a copy of the source table after a correct submission.
// ============================================================

export const PHASE_LABEL = {
  filtering:     "WHERE — filtering rows",
  selecting:     "SELECT — choosing columns",
  distincting:   "DISTINCT — removing duplicates",
  grouping:      "GROUP BY — colouring matching rows",
  merging:       "merging rows per group",
  having:        "HAVING — dropping groups",
  joining:       "JOIN — connecting tables",
  joinFiltering: "INNER JOIN — dropping unmatched rows",
  emerging:      "result emerging",
  sorting:       "ORDER BY — sorting",
  limiting:      "LIMIT — taking top N",
  complete:      "transformation complete",
};

// Soft pastel backgrounds used to colour distinct GROUP BY groups during animation.
export const GROUP_TINTS = [
  "rgba(168, 85, 247, 0.18)",  // purple
  "rgba(34, 211, 238, 0.18)",  // cyan
  "rgba(245, 158, 11, 0.18)",  // amber
  "rgba(34, 197, 94, 0.18)",   // green
  "rgba(244, 114, 182, 0.18)", // pink
  "rgba(248, 113, 113, 0.18)", // rose
];

export function computeFirstPhase(parsed, allColumns) {
  // Set operations (UNION / INTERSECT / EXCEPT) and derived-table queries don't
  // map onto the source-row animation — they reshape data the stage can't draw.
  if (!parsed || parsed.type === "set_operation" || parsed.derivedTable) return null;
  // Non-aggregate queries with computed SELECT items (UPPER, SPLIT_PART,
  // window functions, etc.) can't be projected onto source rows — the
  // SELECT phase collapses every column that doesn't match a source-column
  // name, leaving an empty table. Skip animation cleanly even when WHERE
  // would otherwise be the first phase. (Aggregate and JOIN paths already
  // skip SELECT and emerge into the final result.)
  if (!parsed.isAggregate &&
      parsed.selectItems &&
      parsed.selectItems.some((it) => it.expr.type !== "col" && it.expr.type !== "star")) {
    return null;
  }
  if (parsed.where) return "filtering";
  if (parsed.isAggregate) {
    return parsed.groupBy && parsed.groupBy.length ? "grouping" : "merging";
  }
  if (!(parsed.columns.length === 1 && parsed.columns[0] === "*") &&
      parsed.columns.length < allColumns.length) return "selecting";
  if (parsed.distinct) return "distincting";
  if (parsed.orderBy && parsed.orderBy.length) return "sorting";
  if (parsed.limit != null) return "limiting";
  return null;
}

export function AnimationStage({ parsed, sourceColumns, sourceRows, finalResult, onPhaseChange }) {
  // Local visual state. rowOrder holds source-row indices in current visual order.
  const initialOrder = useMemo(() => sourceRows.map((_, i) => i), [sourceRows]);
  const [rowOrder, setRowOrder]         = useState(initialOrder);
  const [hiddenRows, setHiddenRows]     = useState(() => new Set());
  const [collapsedCols, setCollapsedCols] = useState(() => new Set());
  const [rowOffsets, setRowOffsets]     = useState({});  // sourceIdx -> px
  const [lifted, setLifted]             = useState(false);
  const [phase, setPhase]               = useState("init");
  // GROUP BY tinting — sourceIdx → CSS background color. Empty before grouping phase.
  const [rowTints, setRowTints]         = useState({});
  // After the merge/HAVING phases on an aggregate query we swap the source-shaped
  // animation table for the actual aggregated result — that's what makes
  // `SELECT COUNT(*)` visibly resolve to "15", not a survivor row.
  const [showFinalResult, setShowFinalResult] = useState(false);

  // Drive the phase sequence once on mount.
  useEffect(() => {
    let cancelled = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    const announce = (p) => {
      setPhase(p);
      onPhaseChange(p);
    };

    (async () => {
      let currentOrder = initialOrder.slice();
      const ROW_HEIGHT = 30; // px — matches tr height set below

      // 1) FILTER
      if (parsed.where) {
        announce("filtering");
        const drop = new Set();
        const ctx = { tables: TABLES };
        sourceRows.forEach((r, i) => {
          if (!evalExpr(parsed.where, r, ctx)) drop.add(i);
        });
        setHiddenRows(drop);
        const maxStagger = Math.max(0, drop.size - 1) * 50;
        await wait(400 + maxStagger + 300);
        if (cancelled) return;
        currentOrder = currentOrder.filter((i) => !drop.has(i));
        setRowOrder(currentOrder);
        await wait(80);
        if (cancelled) return;
      }

      // 1.25) JOIN — tint matched vs unmatched source rows, drop unmatched on
      // INNER JOIN, then cross-fade to the actual joined result. This is the
      // simplified Phase 9B animation (no table-sliding), but it still teaches
      // the core concept: INNER JOIN drops unmatched rows, LEFT JOIN keeps them.
      const hasJoin = (parsed.joins || []).length > 0;
      if (hasJoin) {
        const firstJoin = parsed.joins[0];
        const rightTable = TABLES[firstJoin.table] || [];
        const rightKeyCol = firstJoin.rightRef.name || firstJoin.rightRef.bound?.split(".")[1];
        const leftKeyCol  = firstJoin.leftRef.name  || firstJoin.leftRef.bound?.split(".")[1];
        const rightKeys = new Set(
          rightTable.map((r) => r[rightKeyCol]).filter((v) => v != null)
        );

        announce("joining");
        const joinTints = {};
        for (const srcIdx of currentOrder) {
          const row = sourceRows[srcIdx];
          const leftKey = row[leftKeyCol];
          const matched = leftKey != null && rightKeys.has(leftKey);
          joinTints[srcIdx] = matched
            ? "rgba(34, 197, 94, 0.18)"
            : "rgba(244, 63, 94, 0.18)";
        }
        setRowTints(joinTints);
        await wait(500);
        if (cancelled) return;

        if (firstJoin.type === "inner") {
          announce("joinFiltering");
          const unmatched = new Set();
          for (const srcIdx of currentOrder) {
            const row = sourceRows[srcIdx];
            const leftKey = row[leftKeyCol];
            if (leftKey == null || !rightKeys.has(leftKey)) unmatched.add(srcIdx);
          }
          if (unmatched.size > 0) {
            setHiddenRows((prev) => {
              const next = new Set(prev);
              unmatched.forEach((i) => next.add(i));
              return next;
            });
            const maxStagger = Math.max(0, unmatched.size - 1) * 50;
            await wait(400 + maxStagger + 200);
            if (cancelled) return;
            currentOrder = currentOrder.filter((i) => !unmatched.has(i));
            setRowOrder(currentOrder);
            await wait(80);
            if (cancelled) return;
          }
        }

        if (finalResult && finalResult.columns && finalResult.columns.length > 0) {
          announce("emerging");
          await wait(280);
          if (cancelled) return;
          setShowFinalResult(true);
          await wait(360);
          if (cancelled) return;
        }

        announce("complete");
        return;
      }

      // 1.5) GROUP BY / aggregate path
      // For aggregate queries we play three phases on the (already-WHERE-filtered)
      // source rows and stop there: grouping (colour) → merging (hide non-survivors)
      // → having (drop failing groups). The final aggregated result is already shown
      // in the Target table above, so we don't re-render it here.
      if (parsed.isAggregate) {
        // Compute group assignments. With no GROUP BY but aggregates present
        // (e.g. `SELECT COUNT(*) FROM shows`), every row belongs to one group.
        const groupOf = {}; // srcIdx -> key
        const groupOrder = [];
        const groupRowsByKey = new Map(); // key -> [srcIdx]
        for (const srcIdx of currentOrder) {
          const r = sourceRows[srcIdx];
          const key = parsed.groupBy && parsed.groupBy.length
            ? parsed.groupBy.map((c) => (r[c] == null ? " NULL" : String(r[c]))).join("|")
            : "__all__";
          groupOf[srcIdx] = key;
          if (!groupRowsByKey.has(key)) {
            groupRowsByKey.set(key, []);
            groupOrder.push(key);
          }
          groupRowsByKey.get(key).push(srcIdx);
        }

        // Phase: grouping — tint each row by its group color.
        announce("grouping");
        const tints = {};
        const colorByKey = {};
        groupOrder.forEach((key, i) => {
          colorByKey[key] = GROUP_TINTS[i % GROUP_TINTS.length];
        });
        for (const srcIdx of currentOrder) {
          tints[srcIdx] = colorByKey[groupOf[srcIdx]];
        }
        setRowTints(tints);
        await wait(500);
        if (cancelled) return;

        // Phase: merging — hide all rows except the first survivor of each group.
        announce("merging");
        const survivorByKey = new Map();
        for (const srcIdx of currentOrder) {
          if (!survivorByKey.has(groupOf[srcIdx])) survivorByKey.set(groupOf[srcIdx], srcIdx);
        }
        const toMerge = new Set(currentOrder.filter((i) => survivorByKey.get(groupOf[i]) !== i));
        setHiddenRows((prev) => {
          const next = new Set(prev);
          toMerge.forEach((i) => next.add(i));
          return next;
        });
        await wait(500);
        if (cancelled) return;
        currentOrder = currentOrder.filter((i) => !toMerge.has(i));
        setRowOrder(currentOrder);
        await wait(80);
        if (cancelled) return;

        // Phase: having — drop survivor rows whose group fails HAVING.
        if (parsed.having) {
          announce("having");
          const failing = new Set();
          for (const [key, idxs] of groupRowsByKey.entries()) {
            const rowsForGroup = idxs.map((i) => sourceRows[i]);
            if (!evalHaving(parsed.having, rowsForGroup)) failing.add(key);
          }
          const toDrop = new Set(currentOrder.filter((i) => failing.has(groupOf[i])));
          if (toDrop.size > 0) {
            setHiddenRows((prev) => {
              const next = new Set(prev);
              toDrop.forEach((i) => next.add(i));
              return next;
            });
            const maxStagger = Math.max(0, toDrop.size - 1) * 50;
            await wait(400 + maxStagger + 200);
            if (cancelled) return;
            currentOrder = currentOrder.filter((i) => !toDrop.has(i));
            setRowOrder(currentOrder);
            await wait(80);
            if (cancelled) return;
          }
        }

        // Phase: emerging — fade the source-shaped table out, then render the
        // actual aggregated result. Without this step a query like
        // `SELECT COUNT(*)` would leave you staring at a surviving source row.
        if (finalResult && finalResult.columns && finalResult.columns.length > 0) {
          announce("emerging");
          await wait(280);
          if (cancelled) return;
          setShowFinalResult(true);
          await wait(360);
          if (cancelled) return;
        }

        announce("complete");
        return;
      }

      // 2) SELECT
      const selectingAll =
        parsed.columns.length === 1 && parsed.columns[0] === "*";
      if (!selectingAll && parsed.columns.length < sourceColumns.length) {
        announce("selecting");
        const collapse = new Set(
          sourceColumns.filter((c) => !parsed.columns.includes(c))
        );
        setCollapsedCols(collapse);
        await wait(400 + 200);
        if (cancelled) return;
      }

      // 2.5) DISTINCT — runs after SELECT projection, before ORDER BY.
      // Drop later rows whose visible-column values duplicate an earlier row.
      if (parsed.distinct) {
        announce("distincting");
        const visibleSrc =
          parsed.columns.length === 1 && parsed.columns[0] === "*"
            ? sourceColumns
            : parsed.columns;
        const seen = new Set();
        const dropDup = new Set();
        for (const srcIdx of currentOrder) {
          const r = sourceRows[srcIdx];
          const key = visibleSrc
            .map((c) => (r[c] == null ? " NULL" : String(r[c])))
            .join("");
          if (seen.has(key)) dropDup.add(srcIdx);
          else seen.add(key);
        }
        if (dropDup.size > 0) {
          setHiddenRows((prev) => {
            const next = new Set(prev);
            dropDup.forEach((i) => next.add(i));
            return next;
          });
          const maxStagger = Math.max(0, dropDup.size - 1) * 50;
          await wait(400 + maxStagger + 300);
          if (cancelled) return;
          currentOrder = currentOrder.filter((i) => !dropDup.has(i));
          setRowOrder(currentOrder);
          await wait(80);
        } else {
          await wait(400);
        }
        if (cancelled) return;
      }

      // 3) ORDER BY
      if (parsed.orderBy && parsed.orderBy.length) {
        announce("sorting");
        const sortedOrder = [...currentOrder].sort((a, b) => {
          for (const { column, direction } of parsed.orderBy) {
            const av = sourceRows[a][column];
            const bv = sourceRows[b][column];
            if (av == null && bv == null) continue;
            if (av == null) return 1;
            if (bv == null) return -1;
            if (av < bv) return direction === "desc" ? 1 : -1;
            if (av > bv) return direction === "desc" ? -1 : 1;
          }
          return 0;
        });

        const oldPos = {};
        currentOrder.forEach((idx, vi) => { oldPos[idx] = vi; });
        const newPos = {};
        sortedOrder.forEach((idx, vi) => { newPos[idx] = vi; });

        // Lift step: short transition (~200ms) — handled by `rowTransitionFor`.
        setLifted(true);
        await wait(220);
        if (cancelled) return;

        // Translate step: 600ms ease-in-out.
        const offsets = {};
        currentOrder.forEach((idx) => {
          offsets[idx] = (newPos[idx] - oldPos[idx]) * ROW_HEIGHT;
        });
        setRowOffsets(offsets);
        await wait(620);
        if (cancelled) return;

        // Settle: swap the array, drop offsets/lift instantly (no transition).
        setPhase("settling");          // disables transitions for the snap
        setRowOrder(sortedOrder);
        setRowOffsets({});
        setLifted(false);
        currentOrder = sortedOrder;
        await wait(60);
        if (cancelled) return;
      }

      // 4) LIMIT
      if (parsed.limit != null && parsed.limit < currentOrder.length) {
        announce("limiting");
        const toDrop = currentOrder.slice(parsed.limit);
        setHiddenRows((prev) => {
          const next = new Set(prev);
          toDrop.forEach((i) => next.add(i));
          return next;
        });
        const maxStagger = Math.max(0, toDrop.length - 1) * 50;
        await wait(400 + maxStagger + 200);
        if (cancelled) return;
        currentOrder = currentOrder.slice(0, parsed.limit);
        setRowOrder(currentOrder);
        await wait(80);
        if (cancelled) return;
      }

      announce("complete");
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render: a clone of the source, animated according to the per-row/col state.
  const visibleColumns = sourceColumns;

  // Row transition strategy varies by phase.
  // During 'sorting', the lift uses a fast transform transition; once offsets are
  // applied, the 600ms ease-in-out animates the slide. 'settling' disables
  // transitions so the rowOrder/transform reset happens instantly.
  const rowTransitionFor = (visualIdx) => {
    if (phase === "filtering" || phase === "limiting" || phase === "distincting" || phase === "having" || phase === "merging" || phase === "joinFiltering") {
      const delay = visualIdx * 50;
      return `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms, background-color 400ms ease-out`;
    }
    if (phase === "grouping" || phase === "joining") {
      const delay = visualIdx * 40;
      return `background-color 400ms ease-out ${delay}ms, opacity 400ms ease-out, transform 400ms ease-out`;
    }
    if (phase === "sorting") {
      // Lift sub-step has no offsets yet → small transition is fine. Once
      // offsets are applied, the slide takes 600ms. The 200ms baseline on
      // box-shadow handles the lift's shadow.
      const sliding = Object.keys(rowOffsets).length > 0;
      return sliding
        ? "transform 600ms ease-in-out, box-shadow 200ms ease-out"
        : "transform 200ms ease-out, box-shadow 200ms ease-out";
    }
    if (phase === "settling") return "none";
    return "opacity 200ms ease-out, transform 200ms ease-out";
  };

  const cellTransition =
    "max-width 400ms ease-out, padding 400ms ease-out, opacity 300ms ease-out";

  return (
    <section className="rounded-lg border border-amber-500/40 bg-stone-900/50 overflow-hidden">
      <header className="px-3 py-2 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-amber-300">
            Animation
          </span>
          <span className="text-sm text-stone-200 font-medium">
            {PHASE_LABEL[phase] || "preparing…"}
          </span>
        </div>
      </header>
      {showFinalResult && finalResult ? (
        <div
          className="overflow-auto max-h-96 p-3"
          style={{ animation: "sfFadeIn 320ms ease-out" }}
        >
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0">
              <tr className="bg-stone-950">
                {finalResult.columns.map((c) => {
                  const num = isNumericColumn(finalResult.rows, c);
                  return (
                    <th
                      key={c}
                      className={`px-3 py-2 font-mono font-semibold text-amber-200 border-b border-amber-500/30 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                    >
                      {c}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {finalResult.rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-stone-600 italic" colSpan={Math.max(finalResult.columns.length, 1)}>
                    (no rows)
                  </td>
                </tr>
              )}
              {finalResult.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}>
                  {finalResult.columns.map((c) => {
                    const num = isNumericColumn(finalResult.rows, c);
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
                          <span className="text-stone-100 whitespace-pre">{display}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="overflow-auto max-h-96">
        <table className="w-full text-xs border-collapse" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0">
            <tr className="bg-stone-950">
              {visibleColumns.map((c) => {
                const num = isNumericColumn(sourceRows, c);
                const collapsed = collapsedCols.has(c);
                return (
                  <th
                    key={c}
                    className={`font-mono font-semibold text-stone-400 border-b border-stone-800 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                    style={{
                      padding: collapsed ? "0px" : "0.5rem 0.75rem",
                      maxWidth: collapsed ? "0px" : "240px",
                      width: collapsed ? "0px" : "auto",
                      opacity: collapsed ? 0 : 1,
                      overflow: "hidden",
                      transition: cellTransition,
                    }}
                  >
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((srcIdx, visualIdx) => {
              const row = sourceRows[srcIdx];
              const isHidden = hiddenRows.has(srcIdx);
              const sortPx = rowOffsets[srcIdx] || 0;
              const liftPx = lifted && !isHidden ? -3 : 0;
              const hidePx = isHidden ? 20 : 0;
              const translate = sortPx + liftPx + hidePx;
              const tint = rowTints[srcIdx];
              return (
                <tr
                  key={srcIdx}
                  className={!tint ? (visualIdx % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20") : ""}
                  style={{
                    height: "30px",
                    opacity: isHidden ? 0 : 1,
                    transform: `translateY(${translate}px)`,
                    backgroundColor: tint || undefined,
                    boxShadow:
                      lifted && !isHidden
                        ? "0 4px 12px rgba(0,0,0,0.45)"
                        : "0 0 0 rgba(0,0,0,0)",
                    transition: rowTransitionFor(visualIdx),
                  }}
                >
                  {visibleColumns.map((c) => {
                    const num = isNumericColumn(sourceRows, c);
                    const collapsed = collapsedCols.has(c);
                    const display = formatCell(row[c]);
                    return (
                      <td
                        key={c}
                        className={`border-b border-stone-800/50 align-middle ${num ? "text-right tabular-nums" : "text-left"}`}
                        style={{
                          padding: collapsed ? "0px" : "0.25rem 0.75rem",
                          maxWidth: collapsed ? "0px" : "240px",
                          width: collapsed ? "0px" : "auto",
                          opacity: collapsed ? 0 : 1,
                          overflow: "hidden",
                          transition: cellTransition,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {display === null ? (
                          <span
                            className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle"
                            title="NULL"
                          />
                        ) : (
                          <span className="text-stone-200">{display}</span>
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
      )}
    </section>
  );
}
