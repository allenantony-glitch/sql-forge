import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Key, Link2, Map } from 'lucide-react';
import { SCHEMA, RELATIONSHIPS } from '../../data/schema';

// ============================================================
// ER DIAGRAM — visual schema for REAL WORLD challenges
//
// Renders each table as a card with PK/FK icons next to columns
// and draws SVG connectors between related tables. The connectors
// re-measure after layout / resize so they stay attached when the
// diagram reflows vertically on narrow screens.
// ============================================================

function ColumnRow({ col }) {
  const isPk = !!col.pk;
  const isFk = !!col.fk;
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-1 border-b border-stone-800/60 last:border-b-0">
      <span className="flex items-center gap-1.5 min-w-0">
        {isPk && <Key size={11} className="text-amber-400 shrink-0" />}
        {isFk && !isPk && <Link2 size={11} className="text-cyan-400 shrink-0" />}
        {!isPk && !isFk && <span className="inline-block w-[11px]" />}
        <span
          className="text-stone-300 truncate"
          style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
          title={isFk ? `FK → ${col.fk}` : undefined}
        >
          {col.name}
        </span>
      </span>
      <span className="text-[10px] text-stone-500 tabular-nums shrink-0">{col.type}</span>
    </li>
  );
}

function TableCard({ name, columns, innerRef }) {
  return (
    <div
      ref={innerRef}
      data-table={name}
      className="rounded-lg border border-stone-700 bg-stone-900/80 overflow-hidden shadow-sm"
    >
      <header className="px-3 py-2 bg-stone-950/60 border-b border-stone-700">
        <span
          className="text-[11px] uppercase tracking-widest text-amber-300 font-semibold"
          style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
        >
          {name}
        </span>
      </header>
      <ul className="text-xs">
        {columns.map((c) => (
          <ColumnRow key={c.name} col={c} />
        ))}
      </ul>
    </div>
  );
}

// Build an L-shaped path from `from` to `to`. The line leaves the
// FK side horizontally, then turns vertically to reach the PK row.
function lShapePath(from, to) {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
}

export function ERDiagram() {
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const [lines, setLines] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = () => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;

    const next = RELATIONSHIPS.map((rel) => {
      const fromCard = cardRefs.current[rel.from];
      const toCard = cardRefs.current[rel.to];
      if (!fromCard || !toCard) return null;
      const fr = fromCard.getBoundingClientRect();
      const tr = toCard.getBoundingClientRect();

      // Decide which side of each card to attach to. If the FK card sits
      // to the right of the PK card, the line leaves the FK card's LEFT
      // edge and enters the PK card's RIGHT edge — and vice versa.
      const fromIsRight = fr.left > tr.left;
      const from = {
        x: (fromIsRight ? fr.left : fr.right) - containerRect.left,
        y: fr.top + fr.height / 2 - containerRect.top,
      };
      const to = {
        x: (fromIsRight ? tr.right : tr.left) - containerRect.left,
        y: tr.top + tr.height / 2 - containerRect.top,
      };

      const path = lShapePath(from, to);
      return { id: `${rel.from}-${rel.to}`, path, from, to, label: rel.label, fromIsRight };
    }).filter(Boolean);

    setLines(next);
    setSize({ w, h });
  };

  useLayoutEffect(() => {
    measure();
    // Re-measure after fonts settle so card heights are final.
    const t = setTimeout(measure, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    let ro;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(onResize);
      ro.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <section className="rounded-lg border border-stone-700 bg-stone-950/40 p-4">
      <header className="flex items-center gap-2 mb-3">
        <Map size={14} className="text-amber-400" />
        <span className="text-[10px] uppercase tracking-widest text-stone-400">Schema Map</span>
        <span className="text-[11px] text-stone-500 italic">tables, columns, relationships</span>
      </header>

      <div ref={containerRef} className="relative">
        {/* SVG overlay for relationship lines. pointer-events-none so it
            doesn't block hover/focus on the cards. */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size.w || "100%"}
          height={size.h || "100%"}
          viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="er-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#57534e" />
            </marker>
          </defs>
          {lines.map((ln) => (
            <path
              key={ln.id}
              d={ln.path}
              fill="none"
              stroke="#57534e"
              strokeWidth="1"
              markerEnd="url(#er-arrow)"
            />
          ))}
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:order-1">
            <TableCard
              name="episodes"
              columns={SCHEMA.episodes.columns}
              innerRef={(el) => (cardRefs.current.episodes = el)}
            />
          </div>
          <div className="md:order-2">
            <TableCard
              name="shows"
              columns={SCHEMA.shows.columns}
              innerRef={(el) => (cardRefs.current.shows = el)}
            />
          </div>
          <div className="md:order-3">
            <TableCard
              name="reviews"
              columns={SCHEMA.reviews.columns}
              innerRef={(el) => (cardRefs.current.reviews = el)}
            />
          </div>
        </div>
      </div>

      <footer className="mt-3 flex items-center gap-4 text-[10px] text-stone-500">
        <span className="inline-flex items-center gap-1">
          <Key size={10} className="text-amber-400" /> primary key
        </span>
        <span className="inline-flex items-center gap-1">
          <Link2 size={10} className="text-cyan-400" /> foreign key
        </span>
      </footer>
    </section>
  );
}
