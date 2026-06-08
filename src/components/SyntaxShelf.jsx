import { useState } from 'react';
import { SYNTAX_TEMPLATES, GEM_BY_ID, GEM_LEVEL_LABEL, GEM_LEVEL_OPACITY } from '../data/gems';
import { GemShape } from './GemBelt';

// ============================================================
// SYNTAX SHELF — collapsible templates beneath the SQL editor.
// Each template fades / shortens as its gem brightens.
// ============================================================

// `display` is the dimming-adjusted gem map ({ id: { level, ... } }) from
// computeGemDisplay. Reading display level (not stored level) means dimmed
// gems' templates re-appear in the shelf — the spaced-repetition signal also
// brings the syntax back into view.
export function SyntaxShelf({ display }) {
  const [open, setOpen] = useState(false);
  const levelOf = (id) => (display[id]?.level || 0);
  const visible = SYNTAX_TEMPLATES.filter((t) => levelOf(t.gemId) < 4);
  if (visible.length === 0) {
    return (
      <section className="rounded-lg border border-stone-800 bg-stone-900/30 px-3 py-2 text-[11px] text-stone-500 italic">
        Syntax Shelf — empty. Every template is mastered. Forge on.
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <span className="uppercase tracking-widest text-[10px]">Syntax Shelf</span>
          <span className="text-stone-600 italic text-[11px]">templates fade as you master them</span>
        </span>
        <span className="text-stone-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 border-t border-stone-800">
          {visible.map((t) => {
            const gem = GEM_BY_ID[t.gemId];
            const level = levelOf(t.gemId);
            const keywordOnly = level >= 3;
            const display = keywordOnly ? `${t.keyword} …` : t.template;
            return (
              <div
                key={t.id}
                className="rounded border border-stone-800 bg-stone-950/60 p-2 flex items-center gap-2"
                title={`${gem.name} · Level ${level} (${GEM_LEVEL_LABEL[level]})`}
              >
                <span
                  className="shrink-0"
                  style={{
                    opacity: Math.max(0.35, GEM_LEVEL_OPACITY[level]),
                    filter: level >= 2 ? `drop-shadow(0 0 3px ${gem.color}99)` : "none",
                  }}
                >
                  <GemShape shape={gem.shape} color={gem.color} size={16} />
                </span>
                <span className="font-mono text-[11px] text-stone-200 leading-tight">{display}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
