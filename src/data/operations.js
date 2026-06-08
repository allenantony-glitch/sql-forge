// ============================================================
// OPERATION BLOCKS — palette for the Operation Builder
// ============================================================

export const OPERATIONS = {
  filter: { id: "filter", icon: "🔽", label: "FILTER ROWS",     hint: "WHERE",    layer: 1 },
  select: { id: "select", icon: "📐", label: "SELECT COLUMNS",  hint: "SELECT",   layer: 1 },
  sort:   { id: "sort",   icon: "↕️", label: "SORT",            hint: "ORDER BY", layer: 1 },
  limit:  { id: "limit",  icon: "✂️", label: "LIMIT",           hint: "LIMIT",    layer: 1 },
  group:  { id: "group",  icon: "📊", label: "GROUP & COMPUTE", hint: "GROUP BY", layer: 2 },
  having: { id: "having", icon: "🛡️", label: "FILTER GROUPS",   hint: "HAVING",   layer: 2 },
  join:     { id: "join",     icon: "🔗", label: "CONNECT TABLES",  hint: "JOIN",     layer: 3 },
  subquery: { id: "subquery", icon: "🔎", label: "INNER QUERY",     hint: "subquery", layer: 4 },
  window:   { id: "window",   icon: "🪟", label: "WINDOW COMPUTE",  hint: "OVER ()",  layer: 5 },
};

export const OPERATIONS_LIST = ["filter", "select", "sort", "limit", "group", "having", "join", "subquery", "window"];
export const UNLOCKED_THROUGH_LAYER = 4;

// Canonical SQL execution order rank — lower = earlier.
// Subquery is treated as ranking before FILTER: conceptually you compute the
// inner query first, then use its result in WHERE.
export const CANONICAL_RANK = { subquery: -1, filter: 0, group: 1, having: 2, select: 3, sort: 4, limit: 5 };

export function validatePipeline(ops) {
  const seen = new Set();
  const slots = ops.map((op, i) => {
    if (seen.has(op)) {
      return { status: "error", message: `Only one ${OPERATIONS[op].label} block is needed.` };
    }
    seen.add(op);

    let warning = null;
    for (let j = i + 1; j < ops.length; j++) {
      const next = ops[j];
      // Allowed exception: SORT before FILTER is fine (semantically equivalent here)
      if (op === "sort" && next === "filter") continue;

      if (op === "limit" && next === "sort") {
        warning = "LIMIT without SORT first gives arbitrary rows — are you sure?";
        break;
      }
      if (op === "select" && next === "filter") {
        warning = "Filtering after selecting may lose the column your filter needs.";
        break;
      }
      if (
        CANONICAL_RANK[op] != null &&
        CANONICAL_RANK[next] != null &&
        CANONICAL_RANK[next] < CANONICAL_RANK[op]
      ) {
        warning = `${OPERATIONS[op].label} usually comes after ${OPERATIONS[next].label}.`;
        break;
      }
    }
    return warning ? { status: "warning", message: warning } : { status: "ok", message: null };
  });
  const hasErrors = slots.some((s) => s.status === "error");
  return { slots, hasErrors };
}

export function pipelineMatchesExpected(ops, expected) {
  if (!expected) return false;
  if (ops.length !== expected.length) return false;
  const a = [...ops].sort().join(",");
  const b = [...expected].sort().join(",");
  return a === b;
}
