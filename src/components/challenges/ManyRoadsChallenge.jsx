import { useMemo, useState } from 'react';
import { Check, X, Play, RotateCcw, ChevronRight, Shuffle, Lightbulb } from 'lucide-react';
import { parseQuery } from '../../engine/parser';
import { executeQuery, bindParsed } from '../../engine/executor';
import { compareResults } from '../../engine/comparator';
import { TABLES, TABLE_COLUMN_ORDER } from '../../data/shows';
import { HighlightedSql } from '../../utils/highlight';
import { AnimationStage, computeFirstPhase } from '../AnimationStage';
import { SqlEditor } from '../SqlEditor';
import { SyntaxShelf } from '../SyntaxShelf';
import { WhyPanel } from '../WhyPanel';
import { ResultComparison } from '../ResultComparison';

// ============================================================
// MANY ROADS — three approaches, one result.
// Watch all three animations → pick the tradeoff answer → write
// one approach from memory.
// ============================================================

function ApproachTab({ approach, isActive, isWatched, onClick }) {
  const stateClass = isActive
    ? "border-amber-500/60 bg-amber-500/10 text-amber-100"
    : isWatched
    ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-950/30"
    : "border-stone-700 bg-stone-900/40 text-stone-300 hover:border-cyan-500/40 hover:bg-stone-900/70";
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-t-xl border-2 border-b-0 px-4 py-2.5 text-left transition-colors ${stateClass}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70">Tunnel {approach.id.toUpperCase()}</span>
        {isWatched && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-300">
            <Check size={10} /> watched
          </span>
        )}
      </div>
      <div className="text-sm font-semibold truncate">{approach.label}</div>
    </button>
  );
}

function TradeoffOption({ option, isSelected, isCorrect, locked, showResult, onSelect }) {
  let optClass;
  let trailing = null;
  if (showResult && isCorrect) {
    optClass = "border-emerald-500/70 bg-emerald-950/20";
    trailing = <Check size={14} className="text-emerald-300" />;
  } else if (showResult && isSelected) {
    optClass = "border-amber-500/60 bg-amber-950/30";
    trailing = <X size={14} className="text-amber-300" />;
  } else if (isSelected) {
    optClass = "border-cyan-400/70 bg-cyan-500/10";
  } else if (showResult) {
    optClass = "border-stone-800 bg-stone-950/40 opacity-60";
  } else {
    optClass = "border-stone-700 bg-stone-950/40 hover:border-cyan-500/40 hover:bg-stone-900/70";
  }
  return (
    <button
      onClick={() => !locked && onSelect(option.id)}
      disabled={locked}
      className={`w-full text-left rounded-md border-2 px-3 py-2.5 flex items-start gap-3 transition-colors ${optClass} ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="mt-0.5 text-xs font-mono font-semibold text-stone-400 shrink-0">{option.id.toUpperCase()}</span>
      <div className="flex-1">
        <div className="text-sm text-stone-200 leading-relaxed">{option.text}</div>
        {showResult && (isCorrect || isSelected) && option.reasoning && (
          <div className="mt-1.5 text-[12px] text-stone-400 italic leading-relaxed">{option.reasoning}</div>
        )}
      </div>
      {trailing && <span className="shrink-0 mt-0.5">{trailing}</span>}
    </button>
  );
}

export function ManyRoadsChallenge({
  challenge,
  suggestedWriteId,
  status,
  skipAnimations,
  onSolve,
  onNext,
  hasNext,
}) {
  const approaches = challenge.approaches;
  const tradeoff = challenge.tradeoff;

  // Per-approach: parsed AST + executed result (for AnimationStage props).
  const approachMeta = useMemo(() => {
    const out = {};
    for (const a of approaches) {
      try {
        const parsed = parseQuery(a.sql);
        // The animation hand-rolls evalExpr against this AST, which requires
        // column qualifiers to be resolved — without binding, correlated
        // subqueries (NOT EXISTS, etc.) silently mis-evaluate.
        bindParsed(parsed, TABLES);
        const result = executeQuery(a.sql, TABLES);
        const hasJoin = (parsed.joins || []).length > 0;
        const animSourceRows = hasJoin
          ? (TABLES[parsed.table] || [])
          : (TABLES[parsed.table] || []);
        const animSourceCols = TABLE_COLUMN_ORDER[parsed.table] || [];
        const firstPhase = hasJoin ? "joining" : computeFirstPhase(parsed, animSourceCols);
        out[a.id] = { parsed, result, animSourceRows, animSourceCols, firstPhase };
      } catch (e) {
        out[a.id] = { parsed: null, result: { columns: [], rows: [] }, error: e.message || String(e) };
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  const [activeTab, setActiveTab] = useState(approaches[0].id);
  // animationToken: bumped each time the user clicks Watch/Replay for an
  // approach. 0 means "never started" → only the Watch button is shown.
  // A nonzero value mounts AnimationStage with that key.
  const [animationTokens, setAnimationTokens] = useState({});
  const [watched, setWatched] = useState({});

  // Tradeoff
  const [tradeoffPick, setTradeoffPick] = useState(null);
  const [tradeoffSubmitted, setTradeoffSubmitted] = useState(false);
  const tradeoffCorrect = tradeoffSubmitted && tradeoffPick === tradeoff.correctOption;

  // "Now Write One" — which approach to write, the editor, validation.
  // writtenIds tracks every approach the learner has successfully written
  // from memory in this session so they can write all three if they want.
  const [chosenWriteId, setChosenWriteId] = useState(suggestedWriteId || null);
  const [query, setQuery] = useState("");
  const [editorStatus, setEditorStatus] = useState("idle");
  const [editorError, setEditorError] = useState(null);
  const [actualResult, setActualResult] = useState(null);
  const [writtenIds, setWrittenIds] = useState(() => new Set());

  const watchedCount = Object.values(watched).filter(Boolean).length;
  const allWatched = watchedCount === approaches.length;
  const showTradeoff = allWatched;
  const showWriter = tradeoffCorrect;
  const solved = status === "correct";

  const handleWatch = (approachId) => {
    if (skipAnimations) {
      // Skip the animation; just mark as watched immediately.
      setWatched((w) => ({ ...w, [approachId]: true }));
      return;
    }
    setAnimationTokens((t) => ({ ...t, [approachId]: (t[approachId] || 0) + 1 }));
    setWatched((w) => ({ ...w, [approachId]: false }));
  };

  const handlePhaseChange = (approachId) => (phase) => {
    if (phase === "complete") {
      setWatched((w) => ({ ...w, [approachId]: true }));
    }
  };

  const handleSelectTradeoff = (optId) => {
    if (tradeoffCorrect) return;
    setTradeoffPick(optId);
    if (tradeoffSubmitted && optId !== tradeoff.correctOption) {
      // user changed pick after a wrong submit → clear submitted state so the
      // amber feedback resets and they can resubmit cleanly.
      setTradeoffSubmitted(false);
    }
  };

  const handleSubmitTradeoff = () => {
    if (!tradeoffPick) return;
    setTradeoffSubmitted(true);
  };

  const writeApproach = chosenWriteId ? approaches.find((a) => a.id === chosenWriteId) : null;
  const expectedWriteResult = writeApproach ? approachMeta[writeApproach.id].result : null;

  // Picking a different approach to write resets the editor. We don't want to
  // surface a stale "correct" or "wrong" status from the previous approach
  // against a fresh blank editor.
  const pickWriteApproach = (approachId) => {
    if (approachId === chosenWriteId) return;
    setChosenWriteId(approachId);
    setQuery("");
    setEditorStatus("idle");
    setEditorError(null);
    setActualResult(null);
  };

  const handleSubmit = () => {
    if (!writeApproach || !expectedWriteResult) return;
    if (!query.trim()) {
      setEditorStatus("wrong");
      setEditorError("Editor is empty — write a query first.");
      setActualResult(null);
      return;
    }
    try {
      const actual = executeQuery(query, TABLES);
      const writeParsed = approachMeta[writeApproach.id]?.parsed;
      const orderMatters = !!(writeParsed && writeParsed.orderBy && writeParsed.orderBy.length);
      const rowsMatch = compareResults(actual, expectedWriteResult, orderMatters);
      // MANY ROADS approaches all return the same rows by design, so we also
      // require the user's query to use the *mechanism* of the chosen approach
      // (LEFT JOIN, NOT IN, NOT EXISTS, etc). The `match` function lives on
      // the approach data in challenges.js.
      const mechanismMatch = typeof writeApproach.match === "function"
        ? writeApproach.match(query)
        : true;
      if (rowsMatch && mechanismMatch) {
        setEditorStatus("correct");
        setEditorError(null);
        setActualResult(actual);
        const firstWrite = writtenIds.size === 0;
        setWrittenIds((prev) => {
          const next = new Set(prev);
          next.add(writeApproach.id);
          return next;
        });
        // Only fire onSolve the first time — that's the moment the challenge
        // is "complete" for gem/progress purposes. Subsequent writes are
        // optional bonus mastery.
        if (firstWrite) onSolve?.(writeApproach.id);
      } else {
        setEditorStatus("wrong");
        // Distinguish "rows match, wrong mechanism" — easy to miss otherwise,
        // since the result panel looks identical to a correct submission.
        setEditorError(
          rowsMatch && !mechanismMatch
            ? `Right rows, but that's not the ${writeApproach.label} mechanism. Re-read the approach above and try again.`
            : null
        );
        setActualResult(actual);
      }
    } catch (e) {
      setEditorStatus("wrong");
      setEditorError(e.message || String(e));
      setActualResult(null);
    }
  };

  // ────────────────────────────────────────────────────────────
  const activeApproach = approaches.find((a) => a.id === activeTab);
  const activeMeta = approachMeta[activeTab];
  const activeToken = animationTokens[activeTab] || 0;
  const activeWatched = !!watched[activeTab];

  return (
    <>
      {/* ═══════════ THREE PATHS ═══════════ */}
      <section className="mb-4">
        <header className="flex items-center gap-2 mb-2">
          <Shuffle size={14} className="text-cyan-300" />
          <span className="text-[10px] uppercase tracking-widest text-cyan-300">Three Paths to the Same Ore</span>
          <span className="text-[11px] text-stone-500 italic">
            {allWatched
              ? "all three watched — see the tradeoff below"
              : `watch each animation (${watchedCount}/${approaches.length})`}
          </span>
        </header>
        <div className="flex gap-1">
          {approaches.map((a) => (
            <ApproachTab
              key={a.id}
              approach={a}
              isActive={activeTab === a.id}
              isWatched={!!watched[a.id]}
              onClick={() => setActiveTab(a.id)}
            />
          ))}
        </div>
        <div className="rounded-b-xl rounded-tr-xl border-2 border-stone-700 bg-stone-900/40 p-4 space-y-3">
          {/* SQL */}
          <div className="rounded-md border border-stone-800 bg-stone-950/70 overflow-hidden">
            <header className="px-3 py-1.5 border-b border-stone-800 bg-stone-900/60 text-[10px] uppercase tracking-widest text-stone-500">
              Approach {activeApproach.id.toUpperCase()} — {activeApproach.label}
            </header>
            <pre
              className="px-4 py-3 m-0 text-sm leading-6 whitespace-pre-wrap break-words text-stone-200"
              style={{ fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}
            >
              <HighlightedSql text={activeApproach.sql} />
            </pre>
          </div>

          <div className="text-sm text-stone-300 leading-relaxed">{activeApproach.description}</div>

          {/* Animation slot */}
          {activeToken === 0 ? (
            <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-center">
              <button
                onClick={() => handleWatch(activeTab)}
                className="inline-flex items-center gap-2 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Play size={14} /> Watch Animation
              </button>
              <div className="mt-2 text-[11px] text-stone-500 italic">
                {skipAnimations ? "Animations are skipped — clicking marks as watched." : "See how this approach actually executes."}
              </div>
            </div>
          ) : (
            <>
              {activeMeta && activeMeta.firstPhase ? (
                <AnimationStage
                  key={`${activeTab}-${activeToken}`}
                  parsed={activeMeta.parsed}
                  sourceColumns={activeMeta.animSourceCols}
                  sourceRows={activeMeta.animSourceRows}
                  finalResult={activeMeta.result}
                  onPhaseChange={handlePhaseChange(activeTab)}
                />
              ) : (
                <div className="rounded-md border border-stone-800 bg-stone-950/60 p-3 text-xs text-stone-400 italic">
                  (no animation phases for this query — marked as watched)
                </div>
              )}
              {activeWatched && (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] text-stone-400 italic leading-relaxed flex-1">
                    <span className="text-stone-500 font-semibold uppercase tracking-wide text-[10px] mr-1">Mechanism:</span>
                    {activeApproach.mechanism}
                  </div>
                  <button
                    onClick={() => handleWatch(activeTab)}
                    className="inline-flex items-center gap-1.5 rounded border border-stone-700 hover:border-amber-500/60 hover:bg-amber-500/10 text-stone-300 hover:text-amber-200 px-2.5 py-1 text-[11px] transition-colors shrink-0"
                  >
                    <RotateCcw size={11} /> Replay
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ═══════════ TRADEOFF ═══════════ */}
      {showTradeoff && (
        <section
          className={`mb-4 rounded-lg border-2 ${
            tradeoffCorrect
              ? "border-emerald-500/60 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
              : tradeoffSubmitted
              ? "border-amber-500/60"
              : "border-stone-700"
          } bg-stone-900/50 p-4 transition-shadow`}
          style={{ animation: tradeoffCorrect ? undefined : "sfFadeIn 320ms ease-out" }}
        >
          <header className="flex items-center gap-2 mb-3">
            <Shuffle size={14} className="text-cyan-300" />
            <span className="text-[10px] uppercase tracking-widest text-cyan-300">Tradeoff</span>
            <span className="text-sm text-stone-200 font-medium">{tradeoff.question}</span>
          </header>
          <div className="space-y-2">
            {tradeoff.options.map((opt) => (
              <TradeoffOption
                key={opt.id}
                option={opt}
                isSelected={tradeoffPick === opt.id}
                isCorrect={opt.id === tradeoff.correctOption}
                locked={tradeoffCorrect}
                showResult={tradeoffSubmitted}
                onSelect={handleSelectTradeoff}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[11px] italic min-h-[1.25rem] flex-1">
              {tradeoffSubmitted && !tradeoffCorrect && (
                <span className="text-amber-300">
                  Think about which mechanism does the least work per row at scale…
                </span>
              )}
              {tradeoffCorrect && (
                <span className="text-emerald-300 not-italic">Correct.</span>
              )}
            </div>
            {!tradeoffCorrect && (
              <button
                onClick={handleSubmitTradeoff}
                disabled={!tradeoffPick}
                className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
              >
                <Shuffle size={12} /> Submit
              </button>
            )}
          </div>
          {tradeoffCorrect && (
            <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-stone-200 leading-relaxed">
              {tradeoff.explanation}
            </div>
          )}
        </section>
      )}

      {/* ═══════════ NOW WRITE ONE ═══════════ */}
      {showWriter && (
        <section
          className="mb-4 rounded-lg border-2 border-stone-700 bg-stone-900/50 p-4"
          style={{ animation: "sfFadeIn 320ms ease-out" }}
        >
          <header className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-widest text-amber-300">
              Write From Memory
            </span>
            <span className="text-sm text-stone-200 font-medium">
              {writtenIds.size === 0
                ? "Pick an approach and write it from memory."
                : writtenIds.size < approaches.length
                ? `Nice — ${writtenIds.size}/${approaches.length} written. Want to try another?`
                : `All ${approaches.length} written from memory. Total mastery.`}
            </span>
          </header>

          {suggestedWriteId && writtenIds.size === 0 && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2">
              <Lightbulb size={14} className="text-amber-300 mt-0.5 shrink-0" />
              <div className="text-[12px] text-stone-200 leading-relaxed">
                <span className="text-amber-200 font-semibold">Suggestion: </span>
                You've leaned on the same approach in recent MANY ROADS challenges. Try{" "}
                <span className="font-mono text-amber-200">
                  {approaches.find((a) => a.id === suggestedWriteId)?.label}
                </span>{" "}
                this time to build flexibility.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            {approaches.map((a) => {
              const picked = chosenWriteId === a.id;
              const written = writtenIds.has(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => pickWriteApproach(a.id)}
                  className={`rounded-md border-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                    picked
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-100"
                      : written
                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-100 hover:border-emerald-400/60"
                      : "border-stone-700 bg-stone-950/40 text-stone-300 hover:border-cyan-500/40 hover:bg-stone-900/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest opacity-70">
                      Tunnel {a.id.toUpperCase()}
                    </span>
                    {written && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-300">
                        <Check size={10} /> written
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{a.label}</div>
                </button>
              );
            })}
          </div>

          {writeApproach ? (
            <>
              <div className="mb-2 text-[12px] text-stone-400 italic">
                {writtenIds.has(writeApproach.id) ? (
                  <>
                    <span className="text-emerald-300 not-italic">✓ Already written.</span>{" "}
                    You can rewrite <span className="text-stone-200 font-semibold">{writeApproach.label}</span> or pick another tunnel above.
                  </>
                ) : (
                  <>
                    Writing <span className="text-stone-200 font-semibold">{writeApproach.label}</span> from memory.
                    The SQL is hidden — switch tunnels above to peek at any approach again.
                  </>
                )}
              </div>
              <SqlEditor
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  if (editorStatus === "wrong") {
                    setEditorStatus("idle");
                    setEditorError(null);
                  }
                }}
                onSubmit={handleSubmit}
                status={editorStatus}
                errorMessage={editorError}
                submitDisabled={false}
              />
              <div className="mt-2">
                <SyntaxShelf gems={{}} />
              </div>
              {editorStatus === "wrong" && actualResult && expectedWriteResult && (
                <div className="mt-3">
                  <ResultComparison actual={actualResult} expected={expectedWriteResult} errorMessage={editorError} />
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-stone-400 italic">Pick an approach above to begin.</div>
          )}
        </section>
      )}

      {/* Success — challenge complete */}
      {solved && (
        <WhyPanel why={challenge.why} onNext={onNext} hasNext={hasNext} />
      )}
    </>
  );
}
