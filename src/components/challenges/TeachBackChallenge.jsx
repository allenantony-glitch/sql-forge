import { Check, ChevronRight, Lightbulb, GraduationCap, Circle } from 'lucide-react';

// ============================================================
// TEACH-BACK — scenario + prompt + explanation textarea + feedback
// ============================================================
//
// The learner writes a free-form explanation; we score it client-side against
// the challenge's requiredConcepts. The UI hides the SQL editor, source/target
// tables, animations, and operation builder so the page reads as a thinking /
// writing exercise — not a coding one.

export function TeachBackChallenge({
  challenge,
  explanation,
  onChange,
  onSubmit,
  status,
  validation,
  onNext,
  hasNext,
  disabled,
}) {
  const MIN_CHARS = 20;
  const trimmedLen = explanation.trim().length;
  const tooShort = trimmedLen < MIN_CHARS;
  const isCorrect = status === "correct";
  const isPartial = status === "partial";
  const isTooShort = status === "wrong";

  const borderClass = isCorrect
    ? "border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
    : isPartial
    ? "border-amber-500/60 shadow-[0_0_0_2px_rgba(245,158,11,0.15)]"
    : isTooShort
    ? "border-rose-500/70 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
    : "border-stone-800";

  const animClass = isTooShort ? "sf-shake" : "";

  return (
    <div className="space-y-4">
      {/* Scenario card — warm white/cream theme */}
      <section className="rounded-lg border border-amber-200/30 bg-amber-50/5 p-4">
        <header className="flex items-center gap-2 mb-2">
          <GraduationCap size={16} className="text-amber-200/90" />
          <span className="text-[10px] uppercase tracking-widest text-amber-200/80">Scenario</span>
        </header>
        <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-line">{challenge.scenario}</p>
      </section>

      {/* Prompt — the question, slightly larger */}
      <div className="px-1">
        <p className="text-base font-semibold text-stone-100 leading-relaxed">{challenge.prompt}</p>
      </div>

      {/* Explanation input */}
      <section className={`rounded-lg border-2 ${borderClass} ${animClass} bg-stone-950/80 transition-shadow overflow-hidden`}>
        <header className="flex items-center justify-between px-3 py-2 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-stone-500">Your Explanation</span>
            <span className="text-[11px] text-stone-600 italic">in your own words</span>
          </div>
          <span className="text-[11px] text-stone-500 tabular-nums">
            {explanation.length} / ~300 chars
          </span>
        </header>
        <textarea
          value={explanation}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Explain in your own words..."
          rows={5}
          spellCheck={true}
          className="w-full bg-transparent outline-none resize-y px-4 py-3 text-stone-100 placeholder:text-stone-600 leading-relaxed disabled:opacity-70"
          style={{
            fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
            minHeight: "6rem",
            caretColor: "#fbbf24",
          }}
        />
        <div className="px-3 py-2 border-t border-stone-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-stone-500 italic">
            {tooShort
              ? `${MIN_CHARS - trimmedLen} more character${MIN_CHARS - trimmedLen === 1 ? "" : "s"} to enable submit`
              : ""}
          </span>
          <button
            onClick={onSubmit}
            disabled={disabled || tooShort}
            title={tooShort ? `Need at least ${MIN_CHARS} characters` : ""}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
          >
            <GraduationCap size={12} /> Submit Explanation
          </button>
        </div>
      </section>

      {/* Too-short feedback */}
      {isTooShort && (
        <section className="rounded-lg border border-rose-500/40 bg-rose-950/20 p-3 text-sm text-rose-200">
          Your explanation is too short to cover the concepts. Try writing 2-3 sentences.
        </section>
      )}

      {/* Partial feedback — found some, missed others. Learner can edit + resubmit. */}
      {isPartial && validation && (
        <section className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
              <Lightbulb size={16} />
            </span>
            <div className="flex-1 space-y-3">
              <div className="text-amber-300 text-sm font-semibold">
                Almost there — you covered some key ideas but missed others.
              </div>
              {validation.presentConcepts.length > 0 && (
                <div className="space-y-1.5">
                  {validation.presentConcepts.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm text-emerald-200">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">
                        <Check size={12} />
                      </span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {validation.missingConcepts.length > 0 && (
                <div className="space-y-2 pt-1">
                  {validation.missingConcepts.map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-amber-100">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-amber-400/70 text-amber-300 shrink-0">
                          <Circle size={6} className="fill-current" />
                        </span>
                        <span className="font-medium">{c.label}</span>
                      </div>
                      {c.hint && (
                        <div className="ml-7 text-xs text-stone-400 italic leading-relaxed">{c.hint}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Success panel — concept checks + why + Next */}
      {isCorrect && validation && (
        <section className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
              <Check size={16} />
            </span>
            <div className="flex-1 space-y-3">
              <div className="text-emerald-300 text-sm font-semibold">You nailed it.</div>
              <div className="space-y-1.5">
                {validation.presentConcepts.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-emerald-200">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">
                      <Check size={12} />
                    </span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-stone-200 text-sm leading-relaxed pt-1">{challenge.why}</div>
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
      )}
    </div>
  );
}
