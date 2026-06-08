import { useState } from 'react';
import { Lock, X, Plus, AlertTriangle, Wrench, ChevronRight } from 'lucide-react';
import { OPERATIONS, OPERATIONS_LIST, UNLOCKED_THROUGH_LAYER, pipelineMatchesExpected } from '../../data/operations';

// ============================================================
// OPERATION BUILDER — palette, pipeline, reference bar
// ============================================================
//
// Drag state lives in a module-level variable instead of dataTransfer:
// sandboxed iframes (like Claude.ai's artifact preview) silently strip
// custom MIME types from dataTransfer, so a fallback path that reads
// from a shared variable is far more reliable. We still call setData
// with text/plain because some browsers refuse to start a drag without
// any payload.

let activeDrag = null; // { opId, source: "palette" | "pipeline", fromIdx?: number }

export function PaletteBlock({ opId, locked, onTap }) {
  const op = OPERATIONS[opId];
  const onDragStart = (e) => {
    if (locked) { e.preventDefault(); return; }
    activeDrag = { opId, source: "palette" };
    try { e.dataTransfer.setData("text/plain", opId); } catch {}
    e.dataTransfer.effectAllowed = "copyMove";
  };
  const onDragEnd = () => { activeDrag = null; };
  if (locked) {
    return (
      <div
        title={`Unlocked in Layer ${op.layer}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-800 bg-stone-950/60 text-stone-600 text-xs cursor-not-allowed select-none"
      >
        <span className="opacity-40">{op.icon}</span>
        <span>{op.label}</span>
        <Lock size={11} className="text-stone-700 ml-0.5" />
      </div>
    );
  }
  // Click handler is the touch-friendly fallback. Drag still works as before;
  // tapping just adds the block to the next empty slot.
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onTap && onTap(opId)}
      title="Drag into the pipeline, or tap to add to the next empty slot"
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs cursor-grab active:cursor-grabbing hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-colors select-none"
    >
      <span>{op.icon}</span>
      <span className="font-medium">{op.label}</span>
    </button>
  );
}

export function OperationsPalette({ onTapBlock }) {
  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/50 p-3">
      <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">
        <span className="hidden sm:inline">Available Operations · drag into the pipeline</span>
        <span className="sm:hidden">Tap to add · or drag</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {OPERATIONS_LIST.map((opId) => (
          <PaletteBlock
            key={opId}
            opId={opId}
            locked={OPERATIONS[opId].layer > UNLOCKED_THROUGH_LAYER}
            onTap={onTapBlock}
          />
        ))}
      </div>
    </section>
  );
}

export function PipelineSlot({ index, opId, slotStatus, onRemove, onDropOp, isLast, dropHover, onDragOverSlot, onDragLeaveSlot }) {
  const empty = !opId;
  const op = opId ? OPERATIONS[opId] : null;

  const onDragStartFromSlot = (e) => {
    if (empty) return;
    activeDrag = { opId, source: "pipeline", fromIdx: index };
    try { e.dataTransfer.setData("text/plain", opId); } catch {}
    e.dataTransfer.effectAllowed = "copyMove";
  };
  const onDragEndFromSlot = () => { activeDrag = null; };

  const allowDrop = (e) => {
    e.preventDefault();
    // dropEffect must be compatible with effectAllowed; "copy" satisfies "copyMove".
    e.dataTransfer.dropEffect = "copy";
    onDragOverSlot(index);
  };

  // status → border colors
  let borderClass = "border-dashed border-stone-700";
  if (!empty) {
    if (slotStatus === "error")   borderClass = "border-rose-500/70";
    else if (slotStatus === "warning") borderClass = "border-amber-500/60";
    else                          borderClass = "border-emerald-500/60";
  }
  if (dropHover) borderClass = "border-cyan-400/80";

  return (
    <div className="relative">
      <div
        onDragOver={allowDrop}
        onDragLeave={() => onDragLeaveSlot(index)}
        onDrop={(e) => { e.preventDefault(); onDropOp(e, index); onDragLeaveSlot(index); }}
        className={`group relative rounded-lg border-2 ${borderClass} transition-colors ${
          empty ? "bg-stone-950/40" : "bg-stone-900/70"
        }`}
      >
        {empty ? (
          <div className="px-4 py-3 text-xs text-stone-600 italic flex items-center gap-2">
            <Plus size={12} />
            Drop an operation here
          </div>
        ) : (
          <div
            draggable
            onDragStart={onDragStartFromSlot}
            onDragEnd={onDragEndFromSlot}
            className="px-4 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-stone-400 text-[10px] font-mono">
              {index + 1}
            </span>
            <span className="text-lg leading-none">{op.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-stone-100">{op.label}</div>
              <div className="text-[11px] text-stone-500 font-mono">{op.hint}</div>
            </div>
            <button
              onClick={onRemove}
              className="text-stone-500 hover:text-rose-300 transition-colors p-1"
              aria-label="Remove operation"
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Inline status message under filled slot */}
      {!empty && slotStatus && slotStatus !== "ok" && (
        <div
          className={`mt-1 ml-2 text-[11px] flex items-center gap-1.5 ${
            slotStatus === "error" ? "text-rose-300" : "text-amber-300"
          }`}
        >
          <AlertTriangle size={11} />
          <span>{slotStatus === "error" ? "Duplicate block" : "warning"}</span>
        </div>
      )}

      {/* Connector to next block */}
      {!isLast && (
        <div className="flex justify-center py-1">
          <div className={`w-px h-3 ${!empty && slotStatus === "ok" ? "bg-emerald-500/60" : "bg-stone-700"}`} />
        </div>
      )}
    </div>
  );
}

export function PipelineBuilder({ pipeline, onChange, validation, expectedPipeline, onConfirm, canConfirm }) {
  const [dropHoverIdx, setDropHoverIdx] = useState(null);

  const handleDrop = (e, idx) => {
    // Primary path: module-level state set during dragstart.
    // Fallback: text/plain payload (in case dragstart happened in a context
    // that mutated/lost the module variable — e.g. fast-refresh during dev).
    let drag = activeDrag;
    if (!drag) {
      const opId = e.dataTransfer.getData("text/plain");
      if (!opId || !OPERATIONS[opId]) return;
      drag = { opId, source: "palette" };
    }
    activeDrag = null;

    if (drag.source === "pipeline") {
      const from = drag.fromIdx;
      if (from == null || from === idx) return;
      const next = [...pipeline];
      const [moved] = next.splice(from, 1);
      const insertAt = from < idx ? idx - 1 : idx;
      next.splice(Math.min(insertAt, next.length), 0, moved);
      onChange(next);
    } else {
      if (!OPERATIONS[drag.opId]) return;
      const next = [...pipeline];
      next.splice(Math.min(idx, next.length), 0, drag.opId);
      onChange(next);
    }
  };

  const handleRemove = (idx) => {
    const next = [...pipeline];
    next.splice(idx, 1);
    onChange(next);
  };

  const addSlot = () => onChange([...pipeline, null]);

  // Render: one slot per pipeline entry, plus one trailing empty slot (so users can always drop at the end).
  const renderedSlots = [...pipeline];
  const trailingEmpty = pipeline.length === 0 || pipeline[pipeline.length - 1] != null;
  if (trailingEmpty) renderedSlots.push(null);

  const matched = pipelineMatchesExpected(pipeline.filter(Boolean), expectedPipeline);

  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-amber-400" />
          <span className="text-[10px] uppercase tracking-widest text-stone-400">Operation Pipeline</span>
          <span className="text-[11px] text-stone-500 italic">top → bottom = execution order</span>
        </div>
        <span className="text-[11px] text-stone-500">
          {pipeline.filter(Boolean).length} step{pipeline.filter(Boolean).length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="space-y-0">
        {renderedSlots.map((opId, idx) => {
          const slotStatus = opId ? validation.slots[idx]?.status : null;
          return (
            <PipelineSlot
              key={idx}
              index={idx}
              opId={opId}
              slotStatus={slotStatus}
              onRemove={() => handleRemove(idx)}
              onDropOp={handleDrop}
              isLast={idx === renderedSlots.length - 1}
              dropHover={dropHoverIdx === idx}
              onDragOverSlot={setDropHoverIdx}
              onDragLeaveSlot={(i) => setDropHoverIdx((curr) => (curr === i ? null : curr))}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={addSlot}
          className="text-[11px] text-stone-400 hover:text-stone-200 inline-flex items-center gap-1"
        >
          <Plus size={12} /> Add slot
        </button>

        <div className="flex items-center gap-3">
          {/* Inline warning summary */}
          {validation.slots.some((s) => s.status === "warning") && (
            <span className="text-[11px] text-amber-300 italic max-w-md text-right">
              {validation.slots.find((s) => s.status === "warning")?.message}
            </span>
          )}
          {validation.hasErrors && (
            <span className="text-[11px] text-rose-300 italic">
              Fix the duplicate blocks before continuing.
            </span>
          )}
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
            title={
              !matched
                ? "Build the pipeline that matches the target"
                : validation.hasErrors
                ? "Resolve errors first"
                : "Lock in your pipeline and write the SQL"
            }
          >
            Now write the SQL <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function PipelineReference({ pipeline, onEdit }) {
  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-center gap-3">
      <Wrench size={12} className="text-amber-400" />
      <span className="text-[10px] uppercase tracking-widest text-amber-300">Pipeline</span>
      <div className="flex items-center gap-1 flex-wrap">
        {pipeline.map((opId, idx) => (
          <span key={idx} className="inline-flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900/70 border border-stone-700 text-[11px] text-stone-200">
              <span>{OPERATIONS[opId].icon}</span>
              <span className="font-medium">{OPERATIONS[opId].label}</span>
            </span>
            {idx < pipeline.length - 1 && <ChevronRight size={11} className="text-stone-500" />}
          </span>
        ))}
      </div>
      <button
        onClick={onEdit}
        className="ml-auto text-[11px] text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
      >
        Edit pipeline
      </button>
    </section>
  );
}
