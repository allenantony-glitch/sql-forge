import { Lock, Gem, Sparkles } from 'lucide-react';
import { GEMS, GEM_LEVEL_LABEL, GEM_LEVEL_OPACITY } from '../data/gems';
import { UNLOCKED_THROUGH_LAYER } from '../data/operations';

// ============================================================
// GEM RENDERING — SVG shapes drawn per gem.shape, opacity per level.
// ============================================================

export function GemShape({ shape, color, size = 24 }) {
  const s = size;
  const c = s / 2;
  const stroke = color;
  const fill = color;
  switch (shape) {
    case "triangle":
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <polygon points={`${c},2 ${s - 2},${s - 2} 2,${s - 2}`} fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <polygon points={`${c},2 ${s - 2},${c} ${c},${s - 2} 2,${c}`} fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    case "rectangle":
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <rect x="3" y="6" width={s - 6} height={s - 12} rx="2" fill={fill} stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <circle cx={c} cy={c} r={c - 2} fill={fill} stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "hexagon": {
      const r = c - 2;
      const pts = [0, 60, 120, 180, 240, 300]
        .map((deg) => {
          const a = ((deg - 30) * Math.PI) / 180;
          return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
        })
        .join(" ");
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    }
    case "shield":
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <path
            d={`M${c},2 L${s - 3},6 L${s - 3},${c + 1} Q${s - 3},${s - 3} ${c},${s - 2} Q3,${s - 3} 3,${c + 1} L3,6 Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bridge":
      return (
        <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true">
          <path
            d={`M3,${s - 6} L3,${c} Q3,4 ${c},4 Q${s - 3},4 ${s - 3},${c} L${s - 3},${s - 6}`}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="3" y1={s - 6} x2={s - 3} y2={s - 6} stroke={stroke} strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

export function GemBadge({ gem, level, locked, justLeveled, dimming, daysSinceUse }) {
  const opacity = GEM_LEVEL_OPACITY[level] ?? 0.15;
  const isBlazing = level === 4;
  const isUnlit = level === 0;
  const drawColor = isUnlit ? "#44403c" : gem.color;
  const label = GEM_LEVEL_LABEL[level] || "unlit";
  const daysInt = daysSinceUse != null ? Math.floor(daysSinceUse) : null;
  let tooltip;
  if (locked) {
    tooltip = `${gem.name} — ${gem.concept} — locked (Layer ${gem.layer})`;
  } else if (dimming && daysInt != null) {
    tooltip = `${gem.name} — Needs practice — last used ${daysInt} day${daysInt === 1 ? "" : "s"} ago`;
  } else {
    tooltip = `${gem.name} — ${gem.concept} — Level ${level} (${label})`;
  }

  // The blazing pulse and the dim pulse are distinct: blazing is the "fully
  // internalized" reward, dim is the "needs practice" prompt. Dim wins when
  // both would apply — the user needs to see it before the celebration.
  const pulseClass = dimming
    ? "sf-gem-dim-pulse"
    : isBlazing
    ? "sf-gem-pulse"
    : "";

  return (
    <div
      title={tooltip}
      className="relative shrink-0 inline-flex items-center justify-center"
      style={{ width: 32, height: 32 }}
    >
      <div
        className={[
          "inline-flex items-center justify-center",
          pulseClass,
          justLeveled ? "sf-gem-pop" : "",
        ].join(" ")}
        style={{
          opacity,
          filter: !isUnlit && level >= 2 ? `drop-shadow(0 0 ${level * 2}px ${gem.color}aa)` : "none",
          transition: "opacity 300ms ease-out, filter 300ms ease-out",
        }}
      >
        <GemShape shape={gem.shape} color={drawColor} size={24} />
      </div>
      {locked && (
        <span
          className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-stone-900 border border-stone-700"
          style={{ width: 11, height: 11 }}
        >
          <Lock size={7} className="text-stone-500" />
        </span>
      )}
    </div>
  );
}

// `display` is the post-dimming view: { [gemId]: { level, dimming, daysSinceUse } }.
// Callers pre-compute this with computeGemDisplay() so the belt doesn't have to
// know about timer math.
export function GemBelt({
  display,
  recentLevelUp,
  onPolishDimGem,
  onOpenSidebar,
  streakDays,
}) {
  const earnedCount = GEMS.filter((g) => (display[g.id]?.level || 0) > 0).length;
  const dimGem = GEMS.find((g) => display[g.id]?.dimming) || null;
  return (
    <div className="border-b border-stone-800 bg-stone-950/80 px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3">
      {onOpenSidebar && (
        <button
          type="button"
          onClick={onOpenSidebar}
          className="md:hidden -ml-1 p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800/60 transition-colors shrink-0"
          aria-label="Open layer map"
          title="Open layer map"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <Gem size={16} className="text-stone-600 shrink-0 hidden sm:inline" />
      <div className="text-xs uppercase tracking-widest text-stone-500 shrink-0 hidden sm:block">Gem Belt</div>
      <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1 min-w-0">
        {GEMS.map((gem) => {
          const d = display[gem.id] || { level: 0, dimming: false, daysSinceUse: null };
          const locked = !!gem.layer && gem.layer > UNLOCKED_THROUGH_LAYER;
          return (
            <GemBadge
              key={gem.id}
              gem={gem}
              level={locked ? 0 : d.level}
              locked={locked}
              justLeveled={recentLevelUp === gem.id}
              dimming={!locked && d.dimming}
              daysSinceUse={d.daysSinceUse}
            />
          );
        })}
      </div>
      <div className="text-[11px] text-stone-500 shrink-0 tabular-nums hidden md:block">
        {earnedCount}/{GEMS.filter((g) => !g.layer || g.layer <= UNLOCKED_THROUGH_LAYER).length} lit
      </div>
      {dimGem && onPolishDimGem && (
        <button
          type="button"
          onClick={() => onPolishDimGem(dimGem.id)}
          className="shrink-0 inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 px-2 py-1 text-[11px] transition-colors"
          title={`Polish your ${dimGem.name} gem — head to a challenge that uses it`}
        >
          <Sparkles size={11} />
          <span className="hidden sm:inline">Polish dim gems</span>
          <span className="sm:hidden">Polish</span>
        </button>
      )}
      {streakDays > 0 && (
        <div
          className="shrink-0 inline-flex items-center gap-1 text-[11px] text-amber-300 tabular-nums"
          title={`${streakDays}-day Daily Forge streak`}
        >
          <span aria-hidden="true">🔥</span>
          <span className="hidden sm:inline">{streakDays}</span>
          <span className="sm:hidden">{streakDays}</span>
        </div>
      )}
    </div>
  );
}
