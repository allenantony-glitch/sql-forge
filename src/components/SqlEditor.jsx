import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { HighlightedSql } from '../utils/highlight';

export function SqlEditor({ value, onChange, onSubmit, status, errorMessage, submitDisabled }) {
  const textareaRef = useRef(null);
  const lineCount = Math.max(value.split("\n").length, 4);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  // Auto-grow the textarea so its rendered height tracks soft-wrapped content
  // exactly. Without this the caret drifts out of alignment with the
  // highlighted-syntax overlay once the SQL wraps past the fixed min-height.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [value]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!submitDisabled) onSubmit();
    }
  };

  const borderClass =
    status === "correct"
      ? "border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
      : status === "wrong"
      ? "border-rose-500/70 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
      : "border-stone-800";

  const animClass = status === "wrong" ? "sf-shake" : "";

  return (
    <section className={`rounded-lg border ${borderClass} ${animClass} bg-stone-950/80 transition-shadow`}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-stone-500">SQL Editor</span>
          <span className="text-[11px] text-stone-600">forge your spell</span>
        </div>
        <button
          onClick={onSubmit}
          disabled={submitDisabled}
          className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
        >
          <Play size={12} /> Submit
          <span className="opacity-70 ml-1">⌘↵</span>
        </button>
      </header>
      <div className="flex font-mono text-sm" style={{ fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        <pre
          className="select-none text-right text-stone-600 px-3 py-3 bg-stone-950/60 border-r border-stone-800 leading-6"
          aria-hidden="true"
          style={{ minWidth: "2.75rem", margin: 0 }}
        >
          {lineNumbers}
        </pre>
        <div className="relative flex-1">
          <pre
            className="absolute inset-0 px-3 py-3 m-0 whitespace-pre-wrap break-words text-stone-200 pointer-events-none leading-6"
            aria-hidden="true"
            style={{ fontFamily: "inherit" }}
          >
            <HighlightedSql text={value} />
          </pre>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder=""
            className="relative block w-full bg-transparent outline-none resize-none px-3 py-3 leading-6"
            style={{
              minHeight: `${Math.max(lineCount, 4) * 1.5 + 1.5}rem`,
              color: "transparent",
              caretColor: "#fbbf24",
              WebkitTextFillColor: "transparent",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>
      {errorMessage && (
        <div className="px-3 py-2 text-xs text-rose-300 bg-rose-950/30 border-t border-rose-900/50">
          <span className="font-semibold">Parse error:</span> {errorMessage}
        </div>
      )}
    </section>
  );
}
