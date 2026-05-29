import { Lock, Gem } from 'lucide-react';
import { GEMS, GEM_BY_ID, GEM_LEVEL_LABEL, GEM_LEVEL_OPACITY } from '../data/gems';
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

export function GemBadge({ gem, level, locked, justLeveled }) {
  const opacity = GEM_LEVEL_OPACITY[level] ?? 0.15;
  const isBlazing = level === 4;
  const isUnlit = level === 0;
  const drawColor = isUnlit ? "#44403c" : gem.color;
  const label = GEM_LEVEL_LABEL[level] || "unlit";
  const tooltip = locked
    ? `${gem.name} — ${gem.concept} — locked (Layer ${gem.layer})`
    : `${gem.name} — ${gem.concept} — Level ${level} (${label})`;

  return (
    <div
      title={tooltip}
      className="relative shrink-0 inline-flex items-center justify-center"
      style={{ width: 32, height: 32 }}
    >
      <div
        className={[
          "inline-flex items-center justify-center",
          isBlazing ? "sf-gem-pulse" : "",
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

export function GemBelt({ gems, recentLevelUp }) {
  const earnedCount = GEMS.filter((g) => (gems[g.id] || 0) > 0).length;
  return (
    <div className="border-b border-stone-800 bg-stone-950/80 px-4 py-2 flex items-center gap-3">
      <Gem size={16} className="text-stone-600 shrink-0" />
      <div className="text-xs uppercase tracking-widest text-stone-500 shrink-0">Gem Belt</div>
      <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1">
        {GEMS.map((gem) => {
          const level = gems[gem.id] || 0;
          const locked = !!gem.layer && gem.layer > UNLOCKED_THROUGH_LAYER;
          return (
            <GemBadge
              key={gem.id}
              gem={gem}
              level={locked ? 0 : level}
              locked={locked}
              justLeveled={recentLevelUp === gem.id}
            />
          );
        })}
      </div>
      <div className="text-[11px] text-stone-500 shrink-0 tabular-nums">
        {earnedCount}/{GEMS.filter((g) => !g.layer || g.layer <= UNLOCKED_THROUGH_LAYER).length} lit
      </div>
    </div>
  );
}
