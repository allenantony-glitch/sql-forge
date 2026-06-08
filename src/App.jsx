import { useState, useMemo, useEffect, useRef } from 'react';
import { CHALLENGES } from './data/challenges';
import { LAYERS } from './data/layers';
import { GEMS, GEM_BY_ID, nextGemLevel } from './data/gems';
import { validatePipeline, pipelineMatchesExpected } from './data/operations';
import { TABLES, TABLE_COLUMN_ORDER, SHOWS_DATA, SHOW_COLUMN_ORDER } from './data/shows';
import { parseQuery } from './engine/parser';
import { executeQuery, bindParsed } from './engine/executor';
import { compareResults, validateExplanation, diagnosePredict } from './engine/comparator';
import { GemBelt } from './components/GemBelt';
import { LayerMap } from './components/LayerMap';
import { DataTable } from './components/DataTable';
import { FadedTarget } from './components/FadedTarget';
import { SqlEditor } from './components/SqlEditor';
import { SyntaxShelf } from './components/SyntaxShelf';
import { AnimationStage, computeFirstPhase } from './components/AnimationStage';
import { WhyPanel } from './components/WhyPanel';
import { ResultComparison } from './components/ResultComparison';
import { PipelineBuilder, PipelineReference, OperationsPalette } from './components/challenges/OperationBuilder';
import { PredictQueryCard, ResultBuilder } from './components/challenges/PredictChallenge';
import { WrongToolHint } from './components/challenges/WrongToolHint';
import { DiagnoseChallenge } from './components/challenges/DiagnoseChallenge';
import { TeachBackChallenge } from './components/challenges/TeachBackChallenge';
import { ManyRoadsChallenge } from './components/challenges/ManyRoadsChallenge';
import { RealWorldChallenge } from './components/challenges/RealWorldChallenge';
import { saveState, loadState } from './hooks/usePersistedState';

export default function App() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [queries, setQueries] = useState(() => Object.fromEntries(CHALLENGES.map((c) => [c.id, ""])));
  const [statusById, setStatusById] = useState({}); // id -> "correct" | "wrong"
  const [actualByCurrent, setActualByCurrent] = useState(null);
  const [errorByCurrent, setErrorByCurrent] = useState(null);
  const [completed, setCompleted] = useState([]);

  // Operation Builder state (per challenge)
  const [pipelines, setPipelines] = useState(() => Object.fromEntries(CHALLENGES.map((c) => [c.id, []])));
  const [pipelineConfirmed, setPipelineConfirmed] = useState({}); // id -> boolean
  const editorAnchorRef = useRef(null);

  // PREDICT state — per-challenge builder, current-challenge feedback
  const [predictBuilders, setPredictBuilders] = useState(() =>
    Object.fromEntries(CHALLENGES.map((c) => [c.id, { cols: [], rows: [], typedValues: [] }]))
  );
  const [predictFeedback, setPredictFeedback] = useState(null);

  // DIAGNOSE state — per-challenge selected option id
  const [diagnoseSelections, setDiagnoseSelections] = useState(() =>
    Object.fromEntries(CHALLENGES.filter((c) => c.type === "diagnose").map((c) => [c.id, null]))
  );

  // TEACH-BACK state — per-challenge explanation text + most recent validation
  // result. statusById carries "correct" on full match and "wrong" on too-short;
  // the partial state is derived from teachBackResults existing but not correct.
  const [teachBackTexts, setTeachBackTexts] = useState(() =>
    Object.fromEntries(CHALLENGES.filter((c) => c.type === "teach_back").map((c) => [c.id, ""]))
  );
  const [teachBackResults, setTeachBackResults] = useState({}); // id -> { correct, presentConcepts, missingConcepts }

  // MANY ROADS state — challenge id -> chosen approach id ("a" | "b" | "c").
  // Persisted so we can nudge across sessions when the learner pattern-locks.
  const [manyRoadsHistory, setManyRoadsHistory] = useState({});

  // Animation orchestration: phase is reported up by AnimationStage as it runs.
  // 'idle' before/after any animation; sub-phases while running; 'complete' at the end.
  const [animationPhase, setAnimationPhase] = useState("idle");
  const [animationParsed, setAnimationParsed] = useState(null);
  const [skipAnimations, setSkipAnimations] = useState(false);

  // Gem brightness levels: { [gemId]: 0..4 }. Start every gem at 0 (unlit).
  const [gems, setGems] = useState(() => Object.fromEntries(GEMS.map((g) => [g.id, 0])));
  // The gem ID that most recently changed level — drives a brief pop animation.
  const [recentLevelUp, setRecentLevelUp] = useState(null);
  // Defer persistence until after the initial load attempt completes, so we don't
  // overwrite saved state with the fresh defaults on first render.
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted state from localStorage on mount. Falls through silently
  // if storage isn't available or parsing fails — we just start fresh.
  useEffect(() => {
    const data = loadState();
    if (data) {
      if (data.gems && typeof data.gems === "object") {
        setGems((prev) => {
          const next = { ...prev };
          for (const g of GEMS) {
            const v = data.gems[g.id];
            if (typeof v === "number" && v >= 0 && v <= 4) next[g.id] = v;
          }
          return next;
        });
      }
      if (Array.isArray(data.completed)) {
        setCompleted(data.completed.filter((id) => CHALLENGES.some((c) => c.id === id)));
      }
      if (typeof data.currentChallenge === "string") {
        const idx = CHALLENGES.findIndex((c) => c.id === data.currentChallenge);
        if (idx >= 0) setCurrentIdx(idx);
      }
      if (data.manyRoadsHistory && typeof data.manyRoadsHistory === "object") {
        const filtered = {};
        for (const ch of CHALLENGES) {
          if (ch.type !== "many_roads") continue;
          const v = data.manyRoadsHistory[ch.id];
          if (typeof v === "string") filtered[ch.id] = v;
        }
        setManyRoadsHistory(filtered);
      }
    }
    setHydrated(true);
  }, []);

  const animating =
    animationPhase !== "idle" && animationPhase !== "complete";

  const challenge = CHALLENGES[currentIdx];
  const status = statusById[challenge.id] || "idle";
  const query = queries[challenge.id] || "";

  const isOpBuilder = challenge.type === "operation_builder";
  const isPredict = challenge.type === "predict";
  const isWrongTool = challenge.type === "wrong_tool";
  const isDiagnose = challenge.type === "diagnose";
  const isTeachBack = challenge.type === "teach_back";
  const isManyRoads = challenge.type === "many_roads";
  const isRealWorld = challenge.type === "real_world";
  const pipeline = pipelines[challenge.id] || [];
  const pipelineFilled = pipeline.filter(Boolean);
  const pipelineValidation = useMemo(() => validatePipeline(pipelineFilled), [pipelineFilled]);
  const pipelineMatches = pipelineMatchesExpected(pipelineFilled, challenge.expectedPipeline);
  const canConfirmPipeline = isOpBuilder && pipelineMatches && !pipelineValidation.hasErrors;
  const isPipelineConfirmed = !!pipelineConfirmed[challenge.id];
  const editorLocked = isOpBuilder && !isPipelineConfirmed;

  const builderState = predictBuilders[challenge.id] || { cols: [], rows: [], typedValues: [] };

  const expectedResult = useMemo(() => {
    try {
      return executeQuery(challenge.targetSql, TABLES);
    } catch {
      return { columns: [], rows: [] };
    }
  }, [challenge.targetSql]);

  // For challenges with a `tables` field (Layer 3+) we render multiple source
  // tables side by side. The PICKER source (used by PREDICT's row selection)
  // is either the explicitly named `predictSourceTable` or the first listed.
  // Single-table challenges (Layer 1-2) fall through to the shows table.
  const sourceTables = useMemo(() => {
    if (challenge.tables && challenge.tables.length) {
      const pickerName = challenge.predictSourceTable || challenge.tables[0];
      return challenge.tables.map((name) => ({
        name,
        columns: TABLE_COLUMN_ORDER[name] || [],
        rows: TABLES[name] || [],
        isPicker: name === pickerName,
      }));
    }
    return [{ name: "shows", columns: SHOW_COLUMN_ORDER, rows: SHOWS_DATA, isPicker: true }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  const pickerSource = sourceTables.find((t) => t.isPicker) || sourceTables[0];
  const sourceColumns = pickerSource.columns;
  const sourceRows = pickerSource.rows;
  const isMultiSource = sourceTables.length > 1;

  // PREDICT: columns the user can pick that aren't source columns (e.g. "cnt"
  // computed via COUNT(*) AS cnt). They become editable text-input cells.
  const computedColumns = useMemo(
    () => expectedResult.columns.filter((c) => !sourceColumns.includes(c)),
    [expectedResult, sourceColumns]
  );

  // Persist gems + completed + current challenge whenever any of them changes.
  // Held until hydration finishes so we don't blow away saved state on first render.
  useEffect(() => {
    if (!hydrated) return;
    saveState({ gems, completed, currentChallenge: challenge.id, manyRoadsHistory });
  }, [hydrated, gems, completed, challenge.id, manyRoadsHistory]);

  // Earn gems for the just-correctly-solved challenge. Each concept ratchets up
  // to the level its challenge type / breadth warrants. Pop animation triggers
  // for the gem with the largest jump.
  const earnGemsForChallenge = (ch) => {
    if (!ch.concepts || ch.concepts.length === 0) return;
    setGems((prev) => {
      const next = { ...prev };
      let topGain = 0;
      let popId = null;
      for (const concept of ch.concepts) {
        if (!GEM_BY_ID[concept]) continue;
        const before = next[concept] || 0;
        const after = nextGemLevel(before, ch);
        if (after > before) {
          next[concept] = after;
          const gain = after - before;
          if (gain > topGain) { topGain = gain; popId = concept; }
        }
      }
      if (popId) {
        setRecentLevelUp(popId);
        setTimeout(() => setRecentLevelUp((cur) => (cur === popId ? null : cur)), 500);
      }
      return next;
    });
  };

  const handleResetProgress = () => {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      if (!window.confirm("Reset all progress? Gems, completed challenges, and saved position will be wiped.")) return;
    }
    setGems(Object.fromEntries(GEMS.map((g) => [g.id, 0])));
    setCompleted([]);
    setStatusById({});
    setCurrentIdx(0);
    setActualByCurrent(null);
    setErrorByCurrent(null);
    setAnimationPhase("idle");
    setAnimationParsed(null);
    setPredictFeedback(null);
    setPipelineConfirmed({});
    setPredictBuilders(Object.fromEntries(CHALLENGES.map((c) => [c.id, { cols: [], rows: [], typedValues: [] }])));
    setDiagnoseSelections(Object.fromEntries(CHALLENGES.filter((c) => c.type === "diagnose").map((c) => [c.id, null])));
    setTeachBackTexts(Object.fromEntries(CHALLENGES.filter((c) => c.type === "teach_back").map((c) => [c.id, ""])));
    setTeachBackResults({});
    setManyRoadsHistory({});
    setQueries(Object.fromEntries(CHALLENGES.map((c) => [c.id, ""])));
    setPipelines(Object.fromEntries(CHALLENGES.map((c) => [c.id, []])));
  };

  const handleSubmit = () => {
    if (animating) return;
    if (editorLocked) return;
    if (!query.trim()) {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      setActualByCurrent(null);
      setErrorByCurrent("Editor is empty — write a query first.");
      setAnimationPhase("idle");
      setAnimationParsed(null);
      return;
    }
    try {
      const parsed = parseQuery(query);
      const hasCtes = (parsed.ctes || []).length > 0;
      // bindParsed walks the outer query's column refs against the table map.
      // CTE-defined names aren't in TABLES until executeQuery registers them
      // mid-flight, so binding the outer query first would throw. Skip — the
      // animation also can't render CTE pipelines, so we'd skip animation
      // either way.
      if (!hasCtes) bindParsed(parsed, TABLES);
      const actual = executeQuery(query, TABLES);
      // The target's ORDER BY is what makes order matter; derive once per check.
      let targetOrderMatters = false;
      try {
        const parsedTarget = parseQuery(challenge.targetSql);
        targetOrderMatters = !!(parsedTarget.orderBy && parsedTarget.orderBy.length);
      } catch { /* unreachable for valid targets */ }
      if (compareResults(actual, expectedResult, targetOrderMatters)) {
        setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
        setActualByCurrent(actual);
        setErrorByCurrent(null);
        setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
        earnGemsForChallenge(challenge);

        if (skipAnimations) {
          setAnimationParsed(null);
          setAnimationPhase("idle");
        } else {
          const isSetOp = parsed.type === "set_operation";
          const hasJoin = !isSetOp && (parsed.joins || []).length > 0;
          // AnimationStage walks `sourceRows` (the picker table). A derived-table
          // query's outer scope refers to the subquery's output columns, which
          // don't exist on the picker row — animating would just drop every row.
          // UNION/INTERSECT/EXCEPT can't be animated against a single source either.
          // CTE queries reference virtual tables AnimationStage doesn't know about.
          // Skip cleanly instead.
          const isDerived = !isSetOp && !!parsed.derivedTable;
          const first = (isSetOp || isDerived || hasCtes) ? null : (hasJoin ? "joining" : computeFirstPhase(parsed, sourceColumns));
          if (first) {
            setAnimationParsed(parsed);
            setAnimationPhase(first); // AnimationStage takes over from here
          } else {
            setAnimationParsed(null);
            setAnimationPhase("idle");
          }
        }
      } else {
        setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
        setActualByCurrent(actual);
        setErrorByCurrent(null);
        setAnimationPhase("idle");
        setAnimationParsed(null);
      }
    } catch (e) {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      setActualByCurrent(null);
      setErrorByCurrent(e.message || String(e));
      setAnimationPhase("idle");
      setAnimationParsed(null);
    }
  };

  const goToChallenge = (idx) => {
    if (idx < 0 || idx >= CHALLENGES.length) return;
    setCurrentIdx(idx);
    setActualByCurrent(null);
    setErrorByCurrent(null);
    setAnimationPhase("idle");
    setAnimationParsed(null);
    setPredictFeedback(null);
  };

  // ---- PREDICT handlers ----
  const setBuilder = (next) => {
    setPredictBuilders((p) => ({ ...p, [challenge.id]: next }));
    setPredictFeedback(null);
    if (statusById[challenge.id] === "wrong") {
      setStatusById((s) => {
        const copy = { ...s };
        delete copy[challenge.id];
        return copy;
      });
    }
  };

  const togglePredictColumn = (col) => {
    const cur = builderState.cols;
    const idx = cur.indexOf(col);
    if (idx === -1) setBuilder({ ...builderState, cols: [...cur, col] });
    else            setBuilder({ ...builderState, cols: cur.filter((c) => c !== col) });
  };

  const clearPredictColumns = () => setBuilder({ ...builderState, cols: [] });

  const togglePredictSourceRow = (i) => {
    const cur = builderState.rows;
    const typed = builderState.typedValues || [];
    const at = cur.indexOf(i);
    if (at === -1) {
      setBuilder({ ...builderState, rows: [...cur, i], typedValues: [...typed, {}] });
    } else {
      const nextRows = cur.filter((x) => x !== i);
      const nextTyped = typed.filter((_, k) => k !== at);
      setBuilder({ ...builderState, rows: nextRows, typedValues: nextTyped });
    }
  };

  const removePredictRow = (i) => {
    const cur = [...builderState.rows];
    const typed = [...(builderState.typedValues || [])];
    cur.splice(i, 1);
    typed.splice(i, 1);
    setBuilder({ ...builderState, rows: cur, typedValues: typed });
  };

  const movePredictRow = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= builderState.rows.length) return;
    const cur = [...builderState.rows];
    const typed = [...(builderState.typedValues || [])];
    [cur[i], cur[j]] = [cur[j], cur[i]];
    [typed[i], typed[j]] = [typed[j], typed[i]];
    setBuilder({ ...builderState, rows: cur, typedValues: typed });
  };

  const clearPredictRows = () => setBuilder({ ...builderState, rows: [], typedValues: [] });

  const setTypedCell = (rowIdx, col, value) => {
    const typed = [...(builderState.typedValues || [])];
    while (typed.length <= rowIdx) typed.push({});
    typed[rowIdx] = { ...(typed[rowIdx] || {}), [col]: value };
    setBuilder({ ...builderState, typedValues: typed });
  };

  const handleCheckPredict = () => {
    if (animating) return;
    let expected;
    let parsedTarget = null;
    try {
      expected = executeQuery(challenge.targetSql, TABLES);
      parsedTarget = parseQuery(challenge.targetSql);
    } catch {
      expected = { columns: [], rows: [] };
    }
    const orderMatters = !!(parsedTarget && parsedTarget.orderBy && parsedTarget.orderBy.length);
    const diag = diagnosePredict(
      builderState.cols,
      builderState.rows,
      sourceRows,
      expected,
      orderMatters,
      builderState.typedValues || [],
      sourceColumns,
    );
    setPredictFeedback(diag);
    if (diag.ok) {
      setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
      setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
      earnGemsForChallenge(challenge);
      setActualByCurrent(null);
      setErrorByCurrent(null);
      if (skipAnimations) {
        setAnimationParsed(null);
        setAnimationPhase("idle");
      } else {
        try {
          const parsed = parseQuery(challenge.targetSql);
          bindParsed(parsed, TABLES); // AnimationStage hand-rolls evalExpr on this AST
          const hasJoin = (parsed.joins || []).length > 0;
          const isDerived = !!parsed.derivedTable;
          const first = isDerived ? null : (hasJoin ? "joining" : computeFirstPhase(parsed, sourceColumns));
          if (first) {
            setAnimationParsed(parsed);
            setAnimationPhase(first);
          } else {
            setAnimationParsed(null);
            setAnimationPhase("idle");
          }
        } catch {
          setAnimationParsed(null);
          setAnimationPhase("idle");
        }
      }
    } else {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      setAnimationPhase("idle");
      setAnimationParsed(null);
    }
  };

  const handleNext = () => goToChallenge(currentIdx + 1);

  const hasNext = currentIdx < CHALLENGES.length - 1;

  const setPipelineForCurrent = (next) => {
    setPipelines((p) => ({ ...p, [challenge.id]: next }));
    // If the pipeline was confirmed and the user edits it, unconfirm so they re-lock-in.
    if (pipelineConfirmed[challenge.id]) {
      setPipelineConfirmed((c) => ({ ...c, [challenge.id]: false }));
    }
  };

  const confirmPipeline = () => {
    setPipelineConfirmed((c) => ({ ...c, [challenge.id]: true }));
    // Defer scroll so the editor mounts/unlocks first.
    setTimeout(() => {
      editorAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const editPipeline = () => {
    setPipelineConfirmed((c) => ({ ...c, [challenge.id]: false }));
  };

  // DIAGNOSE handlers
  const diagnoseSelected = isDiagnose ? diagnoseSelections[challenge.id] || null : null;
  const selectDiagnoseOption = (optId) => {
    setDiagnoseSelections((s) => ({ ...s, [challenge.id]: optId }));
    // Clear a prior wrong status so the user can re-pick without lingering shake.
    if (statusById[challenge.id] === "wrong") {
      setStatusById((s) => {
        const copy = { ...s };
        delete copy[challenge.id];
        return copy;
      });
    }
  };
  const handleDiagnoseSubmit = () => {
    if (!diagnoseSelected) return;
    if (diagnoseSelected === challenge.correctOption) {
      setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
      setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
      earnGemsForChallenge(challenge);
    } else {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
    }
  };

  // TEACH-BACK handlers
  const teachBackText = isTeachBack ? (teachBackTexts[challenge.id] || "") : "";
  const teachBackResult = isTeachBack ? (teachBackResults[challenge.id] || null) : null;
  // Derive the teach-back UI status from statusById + the validation result.
  // "correct" — all required concepts found
  // "wrong"   — submitted too-short (under 20 chars after trimming)
  // "partial" — submitted, some concepts missing, can revise and resubmit
  // "idle"    — not submitted yet (or text was edited after a partial result)
  let teachBackStatus = "idle";
  if (isTeachBack) {
    if (status === "correct") teachBackStatus = "correct";
    else if (status === "wrong") teachBackStatus = "wrong";
    else if (teachBackResult && !teachBackResult.correct) teachBackStatus = "partial";
  }

  const setTeachBackText = (text) => {
    setTeachBackTexts((t) => ({ ...t, [challenge.id]: text }));
    // Clear stale "wrong" (too-short) status as soon as the learner edits, so the
    // shake border doesn't linger. Partial results stay visible — the learner can
    // see what they still need to cover while they revise.
    if (statusById[challenge.id] === "wrong") {
      setStatusById((s) => {
        const copy = { ...s };
        delete copy[challenge.id];
        return copy;
      });
    }
  };

  const handleTeachBackSubmit = () => {
    if (animating) return;
    const trimmedLen = teachBackText.trim().length;
    if (trimmedLen < 20) {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      // Clear any prior validation so the partial panel doesn't render alongside
      // the too-short shake.
      setTeachBackResults((r) => {
        const copy = { ...r };
        delete copy[challenge.id];
        return copy;
      });
      return;
    }
    const result = validateExplanation(teachBackText, challenge.requiredConcepts);
    setTeachBackResults((r) => ({ ...r, [challenge.id]: result }));
    if (result.correct) {
      setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
      setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
      earnGemsForChallenge(challenge);
    } else {
      // Partial — don't mark complete. Clear any stale "wrong" so the shake fades.
      setStatusById((s) => {
        const copy = { ...s };
        delete copy[challenge.id];
        return copy;
      });
    }
  };

  // WRONG TOOL — find the first hint whose trigger matches the user's query.
  const matchingHint = useMemo(() => {
    if (!isWrongTool || status !== "wrong" || !challenge.hints) return null;
    return challenge.hints.find((h) => {
      try { return h.trigger(query); } catch { return false; }
    }) || null;
  }, [isWrongTool, status, challenge.hints, query]);

  const BADGES = {
    transform: { icon: "⚒️", label: "Forge the Query" },
    operation_builder: { icon: "🔧", label: "Build the Pipeline" },
    predict: { icon: "🔮", label: "Predict the Result" },
    wrong_tool: { icon: "⚡", label: "Find the Right Tool" },
    diagnose: { icon: "🩺", label: "Diagnose the Bug" },
    teach_back: { icon: "🎓", label: "Explain It" },
    many_roads: { icon: "🔀", label: "Explore Alternatives" },
    real_world: { icon: "🗺️", label: "Real World Challenge" },
  };
  const badge = BADGES[challenge.type] || BADGES.transform;

  // MANY ROADS nudge: when the learner has picked the same approach in the
  // most recent 2+ many_roads challenges (other than the current one), suggest
  // a different one this time. Null means "no suggestion."
  const manyRoadsSuggestion = useMemo(() => {
    if (!isManyRoads) return null;
    const priorIds = CHALLENGES
      .filter((c) => c.type === "many_roads" && c.id !== challenge.id)
      .map((c) => manyRoadsHistory[c.id])
      .filter(Boolean);
    if (priorIds.length < 2) return null;
    const lastTwo = priorIds.slice(-2);
    if (lastTwo[0] !== lastTwo[1]) return null;
    const overused = lastTwo[0];
    const alt = (challenge.approaches || []).find((a) => a.id !== overused);
    return alt ? alt.id : null;
  }, [isManyRoads, challenge, manyRoadsHistory]);

  const handleManyRoadsSolve = (writtenApproachId) => {
    setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
    setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
    earnGemsForChallenge(challenge);
    setManyRoadsHistory((h) => ({ ...h, [challenge.id]: writtenApproachId }));
  };

  const handleRealWorldSolve = ({ correct }) => {
    if (correct) {
      setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
      setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
      earnGemsForChallenge(challenge);
    } else {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
    }
  };

  // Layer 1 keeps the warm-amber surface tint; Layer 2 deepens into cool blues;
  // Layer 3 brings two-tone cyan/teal — the crossroads where tunnels meet.
  // Layer 4 drops into the deeper shafts — darker stone, amber lantern glow.
  const LAYER_BACKGROUNDS = {
    1: "radial-gradient(1200px 600px at 20% -10%, rgba(120, 53, 15, 0.15), transparent 60%), radial-gradient(900px 500px at 110% 20%, rgba(8, 47, 73, 0.18), transparent 60%), linear-gradient(180deg, #0c0a09 0%, #1c1917 100%)",
    2: "radial-gradient(1200px 600px at 20% -10%, rgba(30, 64, 175, 0.22), transparent 60%), radial-gradient(900px 500px at 110% 20%, rgba(14, 116, 144, 0.22), transparent 60%), linear-gradient(180deg, #0b1120 0%, #0f172a 100%)",
    3: "radial-gradient(900px 500px at 0% 10%, rgba(20, 184, 166, 0.18), transparent 60%), radial-gradient(900px 500px at 100% 30%, rgba(168, 85, 247, 0.16), transparent 60%), linear-gradient(180deg, #082f49 0%, #0f172a 100%)",
    4: "radial-gradient(1200px 600px at 20% -10%, rgba(180, 83, 9, 0.12), transparent 60%), radial-gradient(900px 500px at 110% 20%, rgba(120, 53, 15, 0.15), transparent 60%), linear-gradient(180deg, #0c0a09 0%, #1c1917 100%)",
    5: "radial-gradient(1200px 600px at 20% -10%, rgba(220, 38, 38, 0.14), transparent 60%), radial-gradient(900px 500px at 110% 20%, rgba(234, 88, 12, 0.16), transparent 60%), linear-gradient(180deg, #0c0a09 0%, #1a0f0a 100%)",
  };
  const layerName = LAYERS[challenge.layer - 1]?.name || "Unknown";

  return (
    <div
      className="min-h-screen text-stone-100"
      style={{
        fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
        background: LAYER_BACKGROUNDS[challenge.layer] || LAYER_BACKGROUNDS[1],
        transition: "background 600ms ease-out",
      }}
    >
      <GemBelt gems={gems} recentLevelUp={recentLevelUp} />

      <div className="flex" style={{ minHeight: "calc(100vh - 49px)" }}>
        <LayerMap
          layers={LAYERS}
          challenges={CHALLENGES}
          currentChallengeIdx={currentIdx}
          completedIds={completed}
          onSelectChallenge={goToChallenge}
          onResetProgress={handleResetProgress}
        />

        <main className="flex-1 p-6 overflow-x-hidden">
          {/* Challenge header */}
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-500 mb-1">
                Challenge {currentIdx + 1} of {CHALLENGES.length} — Layer {challenge.layer}: {layerName}
              </div>
              <h1 className="text-2xl font-bold text-stone-100">
                <span className="text-stone-500 font-mono mr-2">{challenge.id}</span>
                {challenge.title}
              </h1>
              <p className="text-sm text-stone-400 mt-1 max-w-2xl">{challenge.description}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-200 shrink-0">
              {badge.icon} {badge.label}
            </div>
          </div>

          {/* DIAGNOSE — completely different UI: broken query + wrong/expected + radio options */}
          {isDiagnose && (
            <DiagnoseChallenge
              challenge={challenge}
              sourceTables={sourceTables}
              selectedId={diagnoseSelected}
              onSelect={selectDiagnoseOption}
              onDiagnose={handleDiagnoseSubmit}
              status={status}
            />
          )}

          {/* TEACH-BACK — scenario + prompt + textarea, no SQL surfaces */}
          {isTeachBack && (
            <TeachBackChallenge
              challenge={challenge}
              explanation={teachBackText}
              onChange={setTeachBackText}
              onSubmit={handleTeachBackSubmit}
              status={teachBackStatus}
              validation={teachBackResult}
              onNext={handleNext}
              hasNext={hasNext}
              disabled={teachBackStatus === "correct"}
            />
          )}

          {/* Predict — query card sits above source + builder */}
          {isPredict && <PredictQueryCard sql={challenge.displaySql} />}

          {/* Source tables — MANY ROADS shows them full-width above its own UI */}
          {isManyRoads && (
            <div className={`mb-4 grid grid-cols-1 ${sourceTables.length > 1 ? "lg:grid-cols-2" : ""} gap-3`}>
              {sourceTables.map((t) => (
                <DataTable
                  key={t.name}
                  title={t.name}
                  columns={t.columns}
                  rows={t.rows}
                  variant="source"
                  maxHeight="max-h-56"
                />
              ))}
            </div>
          )}

          {/* Source + Target/Builder side by side — skip for DIAGNOSE, TEACH-BACK, MANY ROADS, REAL WORLD (each has its own layout) */}
          {!isDiagnose && !isTeachBack && !isManyRoads && !isRealWorld && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {isMultiSource ? (
              <div className="space-y-3">
                {sourceTables.map((t) => (
                  <DataTable
                    key={t.name}
                    title={t.name}
                    columns={t.columns}
                    rows={t.rows}
                    variant="source"
                    maxHeight="max-h-48"
                    selectedRowIndices={isPredict && t.isPicker ? builderState.rows : null}
                    onRowClick={
                      isPredict && t.isPicker && !animating && status !== "correct"
                        ? togglePredictSourceRow
                        : null
                    }
                  />
                ))}
              </div>
            ) : (
              <DataTable
                title={sourceTables[0].name}
                columns={sourceTables[0].columns}
                rows={sourceTables[0].rows}
                variant="source"
                selectedRowIndices={isPredict ? builderState.rows : null}
                onRowClick={
                  isPredict && !animating && status !== "correct"
                    ? togglePredictSourceRow
                    : null
                }
              />
            )}
            {isPredict ? (
              <ResultBuilder
                sourceColumns={sourceColumns}
                sourceRows={sourceRows}
                builderCols={builderState.cols}
                builderRowIdx={builderState.rows}
                typedValues={builderState.typedValues || []}
                computedColumns={computedColumns}
                onToggleColumn={togglePredictColumn}
                onClearColumns={clearPredictColumns}
                onRemoveRow={removePredictRow}
                onMoveRow={movePredictRow}
                onClearRows={clearPredictRows}
                onSetTypedCell={setTypedCell}
                onCheck={handleCheckPredict}
                status={status}
                feedback={predictFeedback}
                disabled={animating || status === "correct"}
              />
            ) : challenge.targetFade && challenge.targetFade !== "full" ? (
              <FadedTarget
                columns={expectedResult.columns}
                rows={expectedResult.rows}
                fadeLevel={challenge.targetFade}
              />
            ) : (
              <DataTable title="expected result" columns={expectedResult.columns} rows={expectedResult.rows} variant="target" />
            )}
          </div>
          )}

          {/* Operation Builder — only for operation_builder challenges */}
          {isOpBuilder && !isPipelineConfirmed && (
            <div className="mb-4 space-y-3">
              <OperationsPalette />
              <PipelineBuilder
                pipeline={pipeline}
                onChange={setPipelineForCurrent}
                validation={pipelineValidation}
                expectedPipeline={challenge.expectedPipeline}
                onConfirm={confirmPipeline}
                canConfirm={canConfirmPipeline}
              />
            </div>
          )}

          {/* Compact pipeline reference once confirmed */}
          {isOpBuilder && isPipelineConfirmed && (
            <div className="mb-3">
              <PipelineReference pipeline={pipelineFilled} onEdit={editPipeline} />
            </div>
          )}

          {/* MANY ROADS — three approaches, tradeoff question, write-from-memory editor */}
          {isManyRoads && (
            <ManyRoadsChallenge
              challenge={challenge}
              suggestedWriteId={manyRoadsSuggestion}
              status={status}
              skipAnimations={skipAnimations}
              onSolve={handleManyRoadsSolve}
              onNext={handleNext}
              hasNext={hasNext}
            />
          )}

          {/* REAL WORLD — owns its own internal flow (ER diagram, table selection, editor, hints, result) */}
          {isRealWorld && (
            <RealWorldChallenge
              challenge={challenge}
              query={query}
              onQueryChange={(v) => setQueries((q) => ({ ...q, [challenge.id]: v }))}
              status={status}
              skipAnimations={skipAnimations}
              gems={gems}
              onSolve={handleRealWorldSolve}
              onNext={handleNext}
              hasNext={hasNext}
            />
          )}

          {/* Editor — hidden in predict, diagnose, teach-back, many-roads, and real-world modes (each has its own answer surface) */}
          {!isPredict && !isDiagnose && !isTeachBack && !isManyRoads && !isRealWorld && (
            <div className="mb-4 space-y-2" ref={editorAnchorRef}>
              {editorLocked ? (
                <div className="rounded-lg border border-dashed border-stone-800 bg-stone-950/40 p-6 text-center text-xs text-stone-500 italic">
                  Build the pipeline above first, then the SQL editor unlocks.
                </div>
              ) : (
                <>
                  <SqlEditor
                    value={query}
                    onChange={(v) => setQueries((q) => ({ ...q, [challenge.id]: v }))}
                    onSubmit={handleSubmit}
                    status={status}
                    errorMessage={errorByCurrent}
                    submitDisabled={animating}
                  />
                  <SyntaxShelf gems={gems} />
                </>
              )}
            </div>
          )}

          {/* Skip-animations toggle — hidden for diagnose and teach-back (neither runs animations) */}
          {!isDiagnose && !isTeachBack && (
            <div className="mb-3 flex justify-end">
              <label className="inline-flex items-center gap-2 text-[11px] text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipAnimations}
                  onChange={(e) => setSkipAnimations(e.target.checked)}
                  className="accent-amber-500"
                />
                Skip animations
              </label>
            </div>
          )}

          {/* Animation stage — visible only when we kicked one off for this submission. Real-world owns its own animation. */}
          {!isRealWorld && status === "correct" && animationParsed && animationPhase !== "idle" && (() => {
            // For JOIN animations, the picker source (e.g. reviews in a
            // PREDICT challenge) may differ from the FROM table the animation
            // needs (shows). Re-derive from parsed.table so JOIN tinting
            // operates on left-side rows.
            const isJoinAnim = (animationParsed.joins || []).length > 0;
            const animSourceRows = isJoinAnim
              ? (TABLES[animationParsed.table] || sourceRows)
              : sourceRows;
            const animSourceCols = isJoinAnim
              ? (TABLE_COLUMN_ORDER[animationParsed.table] || sourceColumns)
              : sourceColumns;
            return (
              <div className="mb-4">
                <AnimationStage
                  parsed={animationParsed}
                  sourceColumns={animSourceCols}
                  sourceRows={animSourceRows}
                  finalResult={expectedResult}
                  onPhaseChange={setAnimationPhase}
                />
              </div>
            );
          })()}

          {/* Wrong-tool hint — shown after a wrong submission when a trigger matches */}
          {isWrongTool && status === "wrong" && matchingHint && (
            <WrongToolHint message={matchingHint.message} />
          )}

          {/* Feedback — teach-back, many-roads, and real-world render their own success panels inside the component */}
          {status === "correct" && !animating && !isTeachBack && !isManyRoads && !isRealWorld && (
            <WhyPanel
              why={isDiagnose ? challenge.explanation : challenge.why}
              onNext={handleNext}
              hasNext={hasNext}
            />
          )}
          {status === "wrong" && !isPredict && !isDiagnose && !isTeachBack && !isManyRoads && !isRealWorld && (
            <ResultComparison actual={actualByCurrent} expected={expectedResult} errorMessage={errorByCurrent} />
          )}
        </main>
      </div>
    </div>
  );
}
