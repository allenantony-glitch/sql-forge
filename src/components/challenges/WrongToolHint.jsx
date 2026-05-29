import { Lightbulb } from 'lucide-react';

// ============================================================
// WRONG TOOL — hint panel shown after the obvious-wrong query is submitted
// ============================================================

export function WrongToolHint({ message }) {
  return (
    <section className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 mb-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 text-amber-300 shrink-0 mt-0.5">
          <Lightbulb size={14} />
        </span>
        <div className="flex-1">
          <div className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-1">Hint</div>
          <div className="text-sm text-amber-100 leading-relaxed">{message}</div>
        </div>
      </div>
    </section>
  );
}
