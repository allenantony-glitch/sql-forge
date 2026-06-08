// ============================================================
// GEMS — concept-tracking jewels in the gem belt
// Brightness rises with depth of understanding (see brightness rules below).
// ============================================================

export const GEMS = [
  { id: "filter",     name: "Filter",     color: "#ef4444", shape: "triangle",  concept: "WHERE" },
  { id: "sort",       name: "Sort",       color: "#3b82f6", shape: "diamond",   concept: "ORDER BY" },
  { id: "select",     name: "Select",     color: "#22c55e", shape: "rectangle", concept: "SELECT columns" },
  { id: "compass",    name: "Compass",    color: "#f59e0b", shape: "circle",    concept: "Execution order" },
  { id: "lens",       name: "Lens",       color: "#a855f7", shape: "circle",    concept: "Query reading" },
  { id: "anvil",      name: "Anvil",      color: "#6b7280", shape: "hexagon",   concept: "Debugging" },
  // Future-layer gems — shown as locked shadows so the learner sees what's ahead.
  { id: "group",      name: "Group",      color: "#8b5cf6", shape: "hexagon",   concept: "GROUP BY",        layer: 2 },
  { id: "guard",      name: "Guard",      color: "#f97316", shape: "shield",    concept: "HAVING",          layer: 2 },
  { id: "count",      name: "Count",      color: "#e2e8f0", shape: "circle",    concept: "Aggregates",      layer: 2 },
  { id: "teacher",    name: "Teacher",    color: "#fafafa", shape: "circle",    concept: "Explaining" },
  { id: "bridge",     name: "Bridge",     color: "#06b6d4", shape: "bridge",    concept: "JOIN" },
  { id: "nest",       name: "Nest",       color: "#eab308", shape: "circle",    concept: "Subqueries" },
  { id: "pathfinder", name: "Pathfinder", color: "#78716c", shape: "circle",    concept: "No scaffolding" },
  { id: "map",        name: "Map",        color: "#b45309", shape: "rectangle", concept: "Real-world translation" },
  { id: "window",     name: "Window",     color: "#38bdf8", shape: "rectangle", concept: "Window functions" },
  { id: "chain",      name: "Chain",      color: "#94a3b8", shape: "hexagon",   concept: "CTEs" },
  { id: "clock",      name: "Clock",      color: "#fbbf24", shape: "circle",    concept: "Date functions" },
  { id: "knife",      name: "Knife",      color: "#cbd5e1", shape: "diamond",   concept: "String functions" },
];

export const GEM_BY_ID = Object.fromEntries(GEMS.map((g) => [g.id, g]));

// Visual + verbal mapping for brightness levels 0–4.
export const GEM_LEVEL_LABEL   = ["unlit", "dim", "warm", "bright", "blazing"];
export const GEM_LEVEL_OPACITY = [0.15, 0.30, 0.60, 0.85, 1.00];

// Syntax templates shown in the shelf. Each template is anchored to a gem;
// as that gem brightens, the template shrinks (full → keyword-only → hidden).
export const SYNTAX_TEMPLATES = [
  { id: "filter_basic", gemId: "filter", keyword: "WHERE",            template: "WHERE <condition>" },
  { id: "filter_combo", gemId: "filter", keyword: "AND / OR",         template: "WHERE <c1> AND|OR <c2>" },
  { id: "filter_null",  gemId: "filter", keyword: "IS NULL",          template: "WHERE <column> IS NULL | IS NOT NULL" },
  { id: "filter_like",  gemId: "filter", keyword: "LIKE",             template: "WHERE <column> LIKE '<pattern>'" },
  { id: "filter_in",    gemId: "filter", keyword: "IN",               template: "WHERE <column> IN (<v1>, <v2>)" },
  { id: "select_cols",  gemId: "select", keyword: "SELECT",           template: "SELECT <col1>, <col2> FROM <table>" },
  { id: "select_dist",  gemId: "select", keyword: "SELECT DISTINCT",  template: "SELECT DISTINCT <column> FROM <table>" },
  { id: "sort_order",   gemId: "sort",   keyword: "ORDER BY",         template: "ORDER BY <column> ASC|DESC" },
  { id: "sort_limit",   gemId: "sort",   keyword: "LIMIT",            template: "LIMIT <number>" },
  { id: "group_by",     gemId: "group",  keyword: "GROUP BY",         template: "GROUP BY <column>" },
  { id: "having",       gemId: "guard",  keyword: "HAVING",           template: "HAVING <aggregate> <op> <value>" },
  { id: "count",        gemId: "count",  keyword: "COUNT",            template: "COUNT(*) | COUNT(<column>)" },
  { id: "count_dist",   gemId: "count",  keyword: "COUNT DISTINCT",   template: "COUNT(DISTINCT <column>)" },
  { id: "sum_avg",      gemId: "count",  keyword: "AVG / SUM",        template: "AVG(<column>) | SUM(<column>)" },
  { id: "min_max",      gemId: "count",  keyword: "MIN / MAX",        template: "MIN(<column>) | MAX(<column>)" },
  { id: "round",        gemId: "count",  keyword: "ROUND",            template: "ROUND(<value>, <decimals>)" },
  { id: "inner_join",   gemId: "bridge", keyword: "INNER JOIN",       template: "FROM <t1> <a1> INNER JOIN <t2> <a2> ON <a1.col> = <a2.col>" },
  { id: "left_join",    gemId: "bridge", keyword: "LEFT JOIN",        template: "FROM <t1> <a1> LEFT JOIN <t2> <a2> ON <a1.col> = <a2.col>" },
  { id: "sub_where",    gemId: "nest",   keyword: "WHERE > (SELECT)", template: "WHERE <col> > (SELECT <agg>(<col>) FROM <table>)" },
  { id: "sub_in",       gemId: "nest",   keyword: "IN (SELECT)",      template: "WHERE <col> IN (SELECT <col> FROM <table>)" },
  { id: "sub_exists",   gemId: "nest",   keyword: "EXISTS",           template: "WHERE EXISTS (SELECT 1 FROM <table> WHERE ...)" },
  { id: "sub_not_ex",   gemId: "nest",   keyword: "NOT EXISTS",       template: "WHERE NOT EXISTS (SELECT 1 FROM <table> WHERE ...)" },
  { id: "sub_derived",  gemId: "nest",   keyword: "FROM (SELECT)",    template: "FROM (SELECT ... FROM <table>) AS <alias>" },
  { id: "set_union",    gemId: "nest",   keyword: "UNION",            template: "SELECT ... UNION SELECT ..." },
  { id: "set_except",   gemId: "nest",   keyword: "EXCEPT",           template: "SELECT ... EXCEPT SELECT ..." },
  { id: "win_rank",     gemId: "window", keyword: "RANK OVER",        template: "RANK() OVER (PARTITION BY <col> ORDER BY <col>)" },
  { id: "win_rownum",   gemId: "window", keyword: "ROW_NUMBER OVER",  template: "ROW_NUMBER() OVER (ORDER BY <col>)" },
  { id: "win_laglead",  gemId: "window", keyword: "LAG / LEAD",       template: "LAG(<col>) OVER (ORDER BY <col>)" },
  { id: "win_running",  gemId: "window", keyword: "Running total",    template: "SUM(<col>) OVER (ORDER BY <col>)" },
  { id: "win_moving",   gemId: "window", keyword: "Moving window",    template: "AVG(<col>) OVER (ORDER BY <col> ROWS BETWEEN <n> PRECEDING AND CURRENT ROW)" },
  { id: "cte_with",     gemId: "chain",  keyword: "WITH",             template: "WITH <name> AS ( SELECT ... ) SELECT ... FROM <name>" },
  { id: "extract",      gemId: "clock",  keyword: "EXTRACT",          template: "EXTRACT(YEAR|QUARTER|MONTH|DAY FROM <date_col>)" },
  { id: "str_funcs",    gemId: "knife",  keyword: "String funcs",     template: "UPPER(<col>) | SUBSTRING(<col>, <start>, <len>) | CONCAT(<a>, <b>)" },
];

// Brightness rules: walk every concept on the challenge and ratchet the gem up.
// A gem only ever goes UP; the highest level wins.
//   Level 1 — first time earning it (any challenge type)
//   Level 2 — earned in a TRANSFORM challenge (figured it out from the visual diff)
//   Level 3 — earned in a challenge that combined 3+ concepts
//   Level 4 — earned in a wrong_tool / diagnose / predict challenge
export function nextGemLevel(prev, challenge) {
  let level = prev;
  if (level < 1) level = 1;
  if (challenge.type === "transform" && level < 2) level = 2;
  if ((challenge.concepts?.length || 0) >= 3 && level < 3) level = 3;
  if ((challenge.type === "wrong_tool" || challenge.type === "diagnose" || challenge.type === "predict" || challenge.type === "teach_back" || challenge.type === "real_world") && level < 4) level = 4;
  return level;
}
