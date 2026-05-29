import { Check, ChevronRight } from 'lucide-react';

export function WhyPanel({ why, onNext, hasNext }) {
  return (
    <section className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
          <Check size={16} />
        </span>
        <div className="flex-1">
          <div className="text-emerald-300 text-sm font-semibold mb-1">Forge successful.</div>
          <div className="text-stone-200 text-sm leading-relaxed">{why}</div>
        </div>
        {hasNext && (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors shrink-0"
          >
            Next Challenge <ChevronRight size={14} />
          </button>
        )}
        {!hasNext && (
          <div className="text-[11px] text-stone-400 italic shrink-0">
            End of seeded content — more veins ahead.
          </div>
        )}
      </div>
    </section>
  );
}
