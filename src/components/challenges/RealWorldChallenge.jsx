import { useEffect, useMemo, useState } from 'react';
import { Map, Check, ChevronRight, X, Lightbulb, Wrench, Plus } from 'lucide-react';
import { TABLES, TABLE_COLUMN_ORDER } from '../../data/shows';
import { OPERATIONS, OPERATIONS_LIST, UNLOCKED_THROUGH_LAYER } from '../../data/operations';
import { parseQuery } from '../../engine/parser';
import { executeQuery, bindParsed } from '../../engine/executor';
import { compareResults } from '../../engine/comparator';
import { DataTable } from '../DataTable';
import { SqlEditor } from '../SqlEditor';
import { SyntaxShelf } from '../SyntaxShelf';
import { AnimationStage, computeFirstPhase } from '../AnimationStage';
import { WhyPanel } from '../WhyPanel';
import { ERDiagram } from './ERDiagram';

// ============================================================
// REAL WORLD CHALLENGE
// Plain English question + ER diagram. No source data, no
// target. The learner walks three internal steps:
//   1) identify tables (toggle, unvalidated)
//   2) optionally plan a pipeline (unvalidated)
//   3) write SQL — validated against targetSql, hint-only on wrong
// On correct, the result table is shown for the first time along
// with the standard animation + WhyPanel.
// ============================================================

function classifyMistake(actual, expected) {
  if (!actual) return "wrongValues";
  const actualCols = actual.columns || [];
  const expectedCols = expected.columns || [];
  const sameSet =
    actualCols.length === expectedCols.length &&
    actualCols.every((c) => expectedCols.includes(c));
  if (!sameSet) return "wrongColumns";
  if ((actual.rows || []).length !== (expected.rows || []).length) return "wrongRowCount";
  return "wrongValues";
}

function QuestionCard({ question }) {
  return (
    <section className="rounded-lg border-2 border-amber-500/50 bg-amber-950/20 p-4 mb-4 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]">
      <div className="flex items-center gap-2 mb-2">
        <Map size={14} className="text-amber-400" />
        <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
          Real World Challenge
        </span>
      </div>
      <p className="text-stone-100 text-base leading-relaxed">{question}</p>
    </section>
  );
}

function TableSelector({ tables, correctTables, selected, onToggle, onConfirm, confirmed }) {
  const correctSet = useMemo(() => new Set(correctTables), [correctTables]);
  const isCorrect =
    selected.size === correctSet.size &&
    [...selected].every((t) => correctSet.has(t));
  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-stone-400">Step 1</div>
          <div className="text-sm text-stone-200 font-semibold">Which tables do you need?</div>
          <div className="text-[11px] text-stone-500 italic">
            Read the schema, then toggle the tables this question needs.
          </div>
        </div>
        {!confirmed && (
          <button
            onClick={onConfirm}
            disabled={!isCorrect}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
            title={isCorrect ? "Lock in your selection" : "Pick the tables this question needs"}
          >
            I've identified the tables <ChevronRight size={12} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tables.map((name) => {
          const isOn = selected.has(name);
          return (
            <button
              key={name}
              onClick={() => onToggle(name)}
              disabled={confirmed}
              className={
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors select-none " +
                (isOn
                  ? "border-amber-400/70 bg-amber-500/20 text-amber-100"
                  : "border-stone-700 bg-stone-950/60 text-stone-400 hover:text-stone-200 hover:border-stone-600") +
                (confirmed ? " cursor-default opacity-80" : "")
              }
              style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
            >
              {name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MiniPipelinePlanner({ pipeline, onAdd, onRemove, onSkip }) {
  const unlocked = OPERATIONS_LIST.filter((id) => OPERATIONS[id].layer <= UNLOCKED_THROUGH_LAYER);
  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-stone-400">Step 2 — optional</div>
          <div className="text-sm text-stone-200 font-semibold flex items-center gap-2">
            <Wrench size={13} className="text-amber-400" /> Plan your pipeline
          </div>
          <div className="text-[11px] text-stone-500 italic">
            Sketch the operations you'll need — for thinking, not validated.
          </div>
        </div>
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors"
        >
          Skip to writing SQL <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {unlocked.map((id) => {
          const op = OPERATIONS[id];
          return (
            <button
              key={id}
              onClick={() => onAdd(id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-[11px] hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-colors"
            >
              <Plus size={10} /> <span>{op.icon}</span> <span>{op.label}</span>
            </button>
          );
        })}
      </div>

      {pipeline.length === 0 ? (
        <div className="rounded border border-dashed border-stone-800 bg-stone-950/40 px-4 py-3 text-[11px] text-stone-600 italic text-center">
          No steps yet — click an operation above to add it.
        </div>
      ) : (
        <ol className="space-y-1">
          {pipeline.map((opId, idx) => {
            const op = OPERATIONS[opId];
            return (
              <li
                key={idx}
                className="flex items-center gap-3 rounded border border-stone-700 bg-stone-900/70 px-3 py-2"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-stone-400 text-[10px] font-mono">
                  {idx + 1}
                </span>
                <span className="text-base leading-none">{op.icon}</span>
                <span className="text-sm text-stone-100 font-medium">{op.label}</span>
                <span className="text-[11px] text-stone-500 font-mono">{op.hint}</span>
                <button
                  onClick={() => onRemove(idx)}
                  className="ml-auto text-stone-500 hover:text-rose-300 transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function HintPanel({ message, actual }) {
  return (
    <section className="rounded-lg border border-rose-500/40 bg-rose-950/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Lightbulb size={16} className="text-amber-300 shrink-0 mt-0.5" />
        <div>
          <div className="text-rose-200 text-sm font-semibold mb-1">Not yet — think it through.</div>
          <div className="text-stone-200 text-sm leading-relaxed">{message}</div>
        </div>
      </div>
      {actual && (
        <DataTable
          title="Your result"
          columns={actual.columns}
          rows={actual.rows}
          variant="source"
          maxHeight="max-h-56"
        />
      )}
    </section>
  );
}

export function RealWorldChallenge({
  challenge,
  query,
  onQueryChange,
  status,
  skipAnimations,
  gems,
  onSolve,
  onNext,
  hasNext,
}) {
  // Internal flow state — resets when the user navigates to a different
  // real_world challenge. The parent owns correct/wrong (`status`), so
  // we leave that alone.
  const [step, setStep] = useState("tables"); // 'tables' | 'pipeline' | 'editor'
  const [selectedTables, setSelectedTables] = useState(() => new Set());
  const [planPipeline, setPlanPipeline] = useState([]);
  const [actual, setActual] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [animationParsed, setAnimationParsed] = useState(null);
  const [animationPhase, setAnimationPhase] = useState("idle");

  // Reset internal scratch state whenever the challenge changes.
  useEffect(() => {
    setStep(status === "correct" ? "editor" : "tables");
    setSelectedTables(new Set());
    setPlanPipeline([]);
    setActual(null);
    setErrorMessage(null);
    setAnimationParsed(null);
    setAnimationPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  const expectedResult = useMemo(() => {
    try {
      return executeQuery(challenge.targetSql, TABLES);
    } catch {
      return { columns: [], rows: [] };
    }
  }, [challenge.targetSql]);

  const animating = animationPhase !== "idle" && animationPhase !== "complete";

  const toggleTable = (name) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const confirmTables = () => setStep("pipeline");
  const skipPipeline = () => setStep("editor");
  const addPlanOp = (id) => setPlanPipeline((p) => [...p, id]);
  const removePlanOp = (idx) => setPlanPipeline((p) => p.filter((_, i) => i !== idx));

  const hintMessage = useMemo(() => {
    if (status !== "wrong") return null;
    const kind = classifyMistake(actual, expectedResult);
    const hints = challenge.hints || {};
    return hints[kind] || hints.wrongValues || "Re-read the question and check your query.";
  }, [status, actual, expectedResult, challenge.hints]);

  const handleSubmit = () => {
    if (animating) return;
    if (!query.trim()) {
      setActual(null);
      setErrorMessage("Editor is empty — write a query first.");
      onSolve({ correct: false });
      return;
    }
    try {
      const parsed = parseQuery(query);
      bindParsed(parsed, TABLES); // AnimationStage hand-rolls evalExpr on this AST
      const result = executeQuery(query, TABLES);
      let targetOrderMatters = false;
      try {
        const pt = parseQuery(challenge.targetSql);
        targetOrderMatters = !!(pt.orderBy && pt.orderBy.length);
      } catch { /* unreachable for valid targets */ }
      const isCorrect = compareResults(result, expectedResult, targetOrderMatters);
      setActual(result);
      setErrorMessage(null);
      if (isCorrect) {
        onSolve({ correct: true });
        if (skipAnimations) {
          setAnimationParsed(null);
          setAnimationPhase("idle");
        } else {
          const hasJoin = (parsed.joins || []).length > 0;
          const isDerived = !!parsed.derivedTable;
          const fromTable = parsed.table;
          const animSourceCols = TABLE_COLUMN_ORDER[fromTable] || [];
          const first = isDerived ? null : (hasJoin ? "joining" : computeFirstPhase(parsed, animSourceCols));
          if (first) {
            setAnimationParsed(parsed);
            setAnimationPhase(first);
          } else {
            setAnimationParsed(null);
            setAnimationPhase("idle");
          }
        }
      } else {
        onSolve({ correct: false });
        setAnimationParsed(null);
        setAnimationPhase("idle");
      }
    } catch (e) {
      setActual(null);
      setErrorMessage(e.message || String(e));
      onSolve({ correct: false });
      setAnimationParsed(null);
      setAnimationPhase("idle");
    }
  };

  // Animation source — derive from parsed.table since real_world challenges
  // can span multiple tables.
  const animSourceRows = animationParsed
    ? (TABLES[animationParsed.table] || [])
    : [];
  const animSourceCols = animationParsed
    ? (TABLE_COLUMN_ORDER[animationParsed.table] || [])
    : [];

  // Show every schema table so the learner has to pick the right ones,
  // not just toggle a pre-filtered list. `challenge.tables` is the
  // expected answer used to gate the "I've identified the tables" button.
  const tableNames = Object.keys(TABLES);
  const correctTables = challenge.tables || [];

  return (
    <div>
      <QuestionCard question={challenge.question} />

      <div className="mb-4">
        <ERDiagram />
      </div>

      <TableSelector
        tables={tableNames}
        correctTables={correctTables}
        selected={selectedTables}
        onToggle={toggleTable}
        onConfirm={confirmTables}
        confirmed={step !== "tables"}
      />

      {step === "pipeline" && (
        <MiniPipelinePlanner
          pipeline={planPipeline}
          onAdd={addPlanOp}
          onRemove={removePlanOp}
          onSkip={skipPipeline}
        />
      )}

      {(step === "editor" || step === "pipeline") && (
        <div className="mb-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
            Step 3 — Write the query
          </div>
          <SqlEditor
            value={query}
            onChange={onQueryChange}
            onSubmit={handleSubmit}
            status={status}
            errorMessage={errorMessage}
            submitDisabled={animating || status === "correct" || step === "pipeline"}
          />
          {step === "pipeline" && (
            <div className="text-[11px] text-stone-500 italic">
              Plan or skip the pipeline above first, then submit.
            </div>
          )}
          <SyntaxShelf gems={gems || {}} />
        </div>
      )}

      {status === "correct" && animationParsed && animationPhase !== "idle" && (
        <div className="mb-4">
          <AnimationStage
            parsed={animationParsed}
            sourceColumns={animSourceCols}
            sourceRows={animSourceRows}
            finalResult={expectedResult}
            onPhaseChange={setAnimationPhase}
          />
        </div>
      )}

      {status === "correct" && !animating && (
        <>
          <div className="mb-4">
            <DataTable
              title="result"
              columns={expectedResult.columns}
              rows={expectedResult.rows}
              variant="target"
            />
          </div>
          <WhyPanel why={challenge.why} onNext={onNext} hasNext={hasNext} />
        </>
      )}

      {status === "wrong" && hintMessage && (
        <HintPanel message={hintMessage} actual={actual} />
      )}
    </div>
  );
}
