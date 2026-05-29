import { useState, useMemo, useEffect, useRef } from "react";
import { Lock, Check, ChevronRight, ChevronUp, ChevronDown, Play, Pickaxe, Gem, X, Plus, AlertTriangle, Wrench, Sparkles, Eraser, Lightbulb, Stethoscope } from "lucide-react";

// ============================================================
// SEED DATA — the streaming-platform "shows" table (15 rows)
// ============================================================

const SHOWS_DATA = [
  { id: 1,  name: "Breaking Bad",     genre: "Crime",   imdb_rating: 9.5, certificate: "A",     premiere_year: 2008, finale_year: 2013, episode_count: 62,  overview: "A chemistry teacher turns to cooking meth to secure his family's future." },
  { id: 2,  name: "Game of Thrones",  genre: "Fantasy", imdb_rating: 9.2, certificate: "A",     premiere_year: 2011, finale_year: 2019, episode_count: 73,  overview: "Noble families vie for the Iron Throne of Westeros." },
  { id: 3,  name: "The Office",       genre: "Comedy",  imdb_rating: 8.9, certificate: "PG-13", premiere_year: 2005, finale_year: 2013, episode_count: 201, overview: "A mockumentary about office workers at a paper company." },
  { id: 4,  name: "Stranger Things",  genre: "Sci-Fi",  imdb_rating: 8.7, certificate: "PG-13", premiere_year: 2016, finale_year: null, episode_count: 34,  overview: "Kids in a small town confront supernatural forces." },
  { id: 5,  name: "The Wire",         genre: "Crime",   imdb_rating: 9.3, certificate: "A",     premiere_year: 2002, finale_year: 2008, episode_count: 60,  overview: "Baltimore through the eyes of cops and criminals." },
  { id: 6,  name: "Friends",          genre: "Comedy",  imdb_rating: 8.9, certificate: "PG",    premiere_year: 1994, finale_year: 2004, episode_count: 236, overview: "Six friends navigate life and love in New York City." },
  { id: 7,  name: "The Crown",        genre: "Drama",   imdb_rating: 8.6, certificate: "PG-13", premiere_year: 2016, finale_year: 2023, episode_count: 60,  overview: "The reign of Queen Elizabeth II from the 1940s onward." },
  { id: 8,  name: "Better Call Saul", genre: "Crime",   imdb_rating: 8.9, certificate: "A",     premiere_year: 2015, finale_year: 2022, episode_count: 63,  overview: "The transformation of a small-time lawyer into Saul Goodman." },
  { id: 9,  name: "Severance",        genre: "Sci-Fi",  imdb_rating: 8.7, certificate: "PG-13", premiere_year: 2022, finale_year: null, episode_count: 18,  overview: "Employees surgically split their work and home memories." },
  { id: 10, name: "Succession",       genre: "Drama",   imdb_rating: 8.8, certificate: "R",     premiere_year: 2018, finale_year: 2023, episode_count: 39,  overview: "A media dynasty fights over the family empire's future." },
  { id: 11, name: "Chernobyl",        genre: "Drama",   imdb_rating: 9.3, certificate: "R",     premiere_year: 2019, finale_year: 2019, episode_count: 5,   overview: "The 1986 nuclear disaster and its terrible aftermath." },
  { id: 12, name: "Sherlock",         genre: "Mystery", imdb_rating: 9.1, certificate: "PG-13", premiere_year: 2010, finale_year: 2017, episode_count: 15,  overview: "A modern update to Sir Arthur Conan Doyle's classic detective." },
  { id: 13, name: "The Mandalorian",  genre: "Sci-Fi",  imdb_rating: 8.5, certificate: "PG",    premiere_year: 2019, finale_year: null, episode_count: 24,  overview: "A bounty hunter protects a mysterious child across the galaxy." },
  { id: 14, name: "The Walking Dead", genre: "Horror",  imdb_rating: 8.1, certificate: "R",     premiere_year: 2010, finale_year: 2022, episode_count: 177, overview: "Survivors of a zombie apocalypse fight to stay alive." },
  { id: 15, name: "Lost",             genre: "Mystery", imdb_rating: 8.3, certificate: "PG-13", premiere_year: 2004, finale_year: 2010, episode_count: 121, overview: "Plane crash survivors uncover the mysteries of a strange island." },
];

const TABLES = { shows: SHOWS_DATA };

const SHOW_COLUMN_ORDER = ["id", "name", "genre", "imdb_rating", "certificate", "premiere_year", "finale_year", "episode_count", "overview"];

// ============================================================
// CHALLENGES — Phase 1 TRANSFORM only
// ============================================================

const CHALLENGES = [
  {
    id: "1.1",
    layer: 1,
    type: "transform",
    title: "The Full Vein",
    description: "Reveal every row and every column of the shows table.",
    targetSql: "SELECT * FROM shows",
    concepts: ["select"],
    why: "SELECT * means \"everything.\" FROM tells the database which table. This is the simplest possible query.",
  },
  {
    id: "1.2",
    layer: 1,
    type: "transform",
    title: "Narrow the Vein",
    description: "Show every row, but only the name and imdb_rating columns.",
    targetSql: "SELECT name, imdb_rating FROM shows",
    concepts: ["select"],
    why: "In production, you never use SELECT *. You name the columns you need. Faster and clearer.",
  },
  {
    id: "1.3",
    layer: 1,
    type: "transform",
    title: "The Filter",
    description: "Reveal only shows with an imdb_rating above 8.5.",
    targetSql: "SELECT * FROM shows WHERE imdb_rating > 8.5",
    concepts: ["filter"],
    why: "WHERE filters rows before the result is assembled. The database checks each row against the condition.",
  },
  {
    id: "1.4",
    layer: 1,
    type: "transform",
    title: "Double Filter",
    description: "Find shows certified 'A' that premiered in 2015 or later.",
    targetSql: "SELECT * FROM shows WHERE certificate = 'A' AND premiere_year >= 2015",
    concepts: ["filter"],
    why: "AND means both conditions must be true. Each row must pass BOTH checks to survive.",
  },
  {
    id: "1.5",
    layer: 1,
    type: "transform",
    title: "The Ranking",
    description: "Reveal the five highest-rated shows. Only their name and rating.",
    targetSql: "SELECT name, imdb_rating FROM shows ORDER BY imdb_rating DESC LIMIT 5",
    concepts: ["select", "sort"],
    why: "ORDER BY sorts results — DESC means highest first. LIMIT caps how many rows you get back. Together they give you 'top N' queries.",
  },
  {
    id: "1.6",
    layer: 1,
    type: "operation_builder",
    title: "Build the Pipeline",
    description: "Build the transformation pipeline, then write the SQL. Show the top 3 shows by rating — only name and imdb_rating.",
    expectedPipeline: ["select", "sort", "limit"],
    targetSql: "SELECT name, imdb_rating FROM shows ORDER BY imdb_rating DESC LIMIT 3",
    concepts: ["select", "sort", "compass"],
    why: "You built the plan first, then wrote the code. In real SQL work, planning the operations before writing syntax prevents mistakes.",
  },
  {
    id: "1.7",
    layer: 1,
    type: "operation_builder",
    title: "The Right Order",
    description: "Build the pipeline, then write the SQL. Find shows rated above 7.0, show only their name, sorted alphabetically.",
    expectedPipeline: ["filter", "select", "sort"],
    targetSql: "SELECT name FROM shows WHERE imdb_rating > 7.0 ORDER BY name ASC",
    concepts: ["filter", "select", "sort", "compass"],
    why: "The execution order matters: filter first (WHERE), then pick columns (SELECT), then sort (ORDER BY). You just built that order with your hands.",
  },
  {
    id: "1.8",
    layer: 1,
    type: "predict",
    title: "Read the Spell",
    description: "Read this query and build the result by hand. Click columns, then click rows, then check.",
    displaySql: "SELECT name, certificate FROM shows WHERE imdb_rating > 8.0 ORDER BY name ASC",
    targetSql: "SELECT name, certificate FROM shows WHERE imdb_rating > 8.0 ORDER BY name ASC",
    concepts: ["filter", "select", "sort", "lens"],
    why: "You just ran SQL in your head — you figured out which rows pass the filter, which columns to keep, and what order they go in. That's the mental model.",
  },
  {
    id: "1.9",
    layer: 1,
    type: "predict",
    title: "The Void",
    description: "Read this query and build the result. Pay attention to the hollow cells.",
    displaySql: "SELECT name, finale_year FROM shows WHERE finale_year IS NULL",
    targetSql: "SELECT name, finale_year FROM shows WHERE finale_year IS NULL",
    concepts: ["filter", "select", "lens"],
    why: "NULL means absence — those hollow cells are shows still running. IS NULL finds them. You identified them visually and now you know what NULL looks like in data.",
  },
  {
    id: "1.10",
    layer: 1,
    type: "wrong_tool",
    title: "The Void Trap",
    description: "Find shows that are still running — they have no finale year.",
    targetSql: "SELECT name, finale_year FROM shows WHERE finale_year IS NULL",
    concepts: ["filter"],
    hints: [
      {
        // Matches `= null` (or `= NULL`, with any whitespace) when no `IS NULL` precedes it.
        trigger: (q) => {
          const lower = q.toLowerCase();
          return /=\s*null\b/.test(lower) && !/is\s+null/.test(lower);
        },
        message:
          "Your query returned nothing because NULL isn't a value — it's the absence of one. You can't use = to compare with absence. Try IS NULL instead.",
      },
    ],
    why: "NULL isn't a value — it's absence. You learned this by hitting the wall: = NULL returns nothing, IS NULL finds the gaps. You won't make this mistake again.",
  },
  {
    id: "1.11",
    layer: 1,
    type: "transform",
    title: "Tie-Breaker",
    description: "Find the single highest-rated show. If two shows share the top rating, pick the one whose name comes first alphabetically.",
    targetSql: "SELECT name, imdb_rating FROM shows ORDER BY imdb_rating DESC, name ASC LIMIT 1",
    concepts: ["select", "sort"],
    why: "Multi-column ORDER BY handles ties: sort by rating first, then alphabetically within ties. This is exactly how HackerRank tie-breaking works.",
  },
  {
    id: "1.12",
    layer: 1,
    type: "transform",
    title: "Unique Crystals",
    description: "List every unique certificate value in the shows table. No duplicates.",
    targetSql: "SELECT DISTINCT certificate FROM shows ORDER BY certificate ASC",
    concepts: ["select", "sort"],
    why: "DISTINCT removes duplicate rows. Combined with ORDER BY you get a clean, sorted list of unique values.",
  },
  {
    id: "1.13",
    layer: 1,
    type: "diagnose",
    title: "Broken Spell",
    description: "This query has a bug. Read it, look at the wrong result, then diagnose the problem.",
    brokenSql: "SELECT name, imdb_rating AS rating FROM shows WHERE rating > 8.0",
    targetSql: "SELECT name, imdb_rating AS rating FROM shows WHERE imdb_rating > 8.0",
    concepts: ["anvil"],
    options: [
      { id: "a", text: "The alias 'rating' doesn't exist when WHERE runs — WHERE executes before SELECT, so the alias hasn't been created yet." },
      { id: "b", text: "AS can only be used with aggregate functions, not regular columns." },
      { id: "c", text: "The > operator doesn't work with aliased columns." },
      { id: "d", text: "You need to put quotes around 'rating' in the WHERE clause." },
    ],
    correctOption: "a",
    explanation: "SQL execution order matters: FROM → WHERE → SELECT. When WHERE runs, the alias 'rating' from SELECT doesn't exist yet. Use the original column name 'imdb_rating' in WHERE. This is a fundamental rule you'll never forget because you just saw it fail.",
    why: "You diagnosed an execution order bug. WHERE runs before SELECT, so aliases don't exist in WHERE. This understanding prevents countless real-world errors.",
  },
  {
    id: "1.14",
    layer: 1,
    type: "operation_builder",
    title: "The Forge",
    description: "Final challenge: build the pipeline AND write the SQL. Find the top 5 still-running shows (no finale year) that premiered after 2010, sorted by rating descending then name ascending. Only name and imdb_rating columns.",
    expectedPipeline: ["filter", "select", "sort", "limit"],
    targetSql: "SELECT name, imdb_rating FROM shows WHERE finale_year IS NULL AND premiere_year > 2010 ORDER BY imdb_rating DESC, name ASC LIMIT 5",
    concepts: ["filter", "select", "sort", "compass"],
    why: "You combined every Layer 1 concept into one query: WHERE with IS NULL and AND, SELECT specific columns, multi-column ORDER BY, and LIMIT. The Surface is forged.",
  },
];

// ============================================================
// OPERATION BLOCKS — palette for the Operation Builder
// ============================================================

const OPERATIONS = {
  filter: { id: "filter", icon: "🔽", label: "FILTER ROWS",     hint: "WHERE",    layer: 1 },
  select: { id: "select", icon: "📐", label: "SELECT COLUMNS",  hint: "SELECT",   layer: 1 },
  sort:   { id: "sort",   icon: "↕️", label: "SORT",            hint: "ORDER BY", layer: 1 },
  limit:  { id: "limit",  icon: "✂️", label: "LIMIT",           hint: "LIMIT",    layer: 1 },
  group:  { id: "group",  icon: "📊", label: "GROUP & COMPUTE", hint: "GROUP BY", layer: 2 },
  having: { id: "having", icon: "🛡️", label: "FILTER GROUPS",   hint: "HAVING",   layer: 2 },
  join:   { id: "join",   icon: "🔗", label: "CONNECT TABLES",  hint: "JOIN",     layer: 3 },
  window: { id: "window", icon: "🪟", label: "WINDOW COMPUTE",  hint: "OVER ()",  layer: 5 },
};

const OPERATIONS_LIST = ["filter", "select", "sort", "limit", "group", "having", "join", "window"];
const UNLOCKED_THROUGH_LAYER = 1;

// Canonical SQL execution order rank — lower = earlier.
const CANONICAL_RANK = { filter: 0, select: 1, sort: 2, limit: 3 };

function validatePipeline(ops) {
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

function pipelineMatchesExpected(ops, expected) {
  if (!expected) return false;
  if (ops.length !== expected.length) return false;
  const a = [...ops].sort().join(",");
  const b = [...expected].sort().join(",");
  return a === b;
}

const LAYERS = [
  { num: 1, name: "The Surface",    subtitle: "See and Filter",         unlocked: true  },
  { num: 2, name: "Upper Mine",     subtitle: "Aggregate and Group",    unlocked: false },
  { num: 3, name: "The Crossroads", subtitle: "Joining Tables",         unlocked: false },
  { num: 4, name: "Deep Shafts",    subtitle: "Subqueries and Sets",    unlocked: false },
  { num: 5, name: "The Core",       subtitle: "Windows, CTEs, Mastery", unlocked: false },
];

// ============================================================
// GEMS — concept-tracking jewels in the gem belt
// Brightness rises with depth of understanding (see brightness rules below).
// ============================================================

const GEMS = [
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
  { id: "teacher",    name: "Teacher",    color: "#fafafa", shape: "circle",    concept: "Explaining",      layer: 2 },
  { id: "bridge",     name: "Bridge",     color: "#06b6d4", shape: "bridge",    concept: "JOIN",            layer: 3 },
  { id: "pathfinder", name: "Pathfinder", color: "#78716c", shape: "circle",    concept: "No scaffolding",  layer: 3 },
];

const GEM_BY_ID = Object.fromEntries(GEMS.map((g) => [g.id, g]));

// Visual + verbal mapping for brightness levels 0–4.
const GEM_LEVEL_LABEL   = ["unlit", "dim", "warm", "bright", "blazing"];
const GEM_LEVEL_OPACITY = [0.15, 0.30, 0.60, 0.85, 1.00];

// Syntax templates shown in the shelf. Each template is anchored to a gem;
// as that gem brightens, the template shrinks (full → keyword-only → hidden).
const SYNTAX_TEMPLATES = [
  { id: "filter_basic", gemId: "filter", keyword: "WHERE",            template: "WHERE <condition>" },
  { id: "filter_combo", gemId: "filter", keyword: "AND / OR",         template: "WHERE <c1> AND|OR <c2>" },
  { id: "filter_null",  gemId: "filter", keyword: "IS NULL",          template: "WHERE <column> IS NULL | IS NOT NULL" },
  { id: "filter_like",  gemId: "filter", keyword: "LIKE",             template: "WHERE <column> LIKE '<pattern>'" },
  { id: "filter_in",    gemId: "filter", keyword: "IN",               template: "WHERE <column> IN (<v1>, <v2>)" },
  { id: "select_cols",  gemId: "select", keyword: "SELECT",           template: "SELECT <col1>, <col2> FROM <table>" },
  { id: "select_dist",  gemId: "select", keyword: "SELECT DISTINCT",  template: "SELECT DISTINCT <column> FROM <table>" },
  { id: "sort_order",   gemId: "sort",   keyword: "ORDER BY",         template: "ORDER BY <column> ASC|DESC" },
  { id: "sort_limit",   gemId: "sort",   keyword: "LIMIT",            template: "LIMIT <number>" },
];

// Brightness rules: walk every concept on the challenge and ratchet the gem up.
// A gem only ever goes UP; the highest level wins.
//   Level 1 — first time earning it (any challenge type)
//   Level 2 — earned in a TRANSFORM challenge (figured it out from the visual diff)
//   Level 3 — earned in a challenge that combined 3+ concepts
//   Level 4 — earned in a wrong_tool / diagnose / predict challenge
function nextGemLevel(prev, challenge) {
  let level = prev;
  if (level < 1) level = 1;
  if (challenge.type === "transform" && level < 2) level = 2;
  if ((challenge.concepts?.length || 0) >= 3 && level < 3) level = 3;
  if ((challenge.type === "wrong_tool" || challenge.type === "diagnose" || challenge.type === "predict") && level < 4) level = 4;
  return level;
}

// ============================================================
// SQL ENGINE — tokenize → parse → evaluate
// Supports: SELECT cols|*, FROM table, optional WHERE with
//   = != <> > < >= <= , AND OR NOT, IS [NOT] NULL, LIKE, IN, BETWEEN
// ============================================================

function tokenize(sql) {
  const tokens = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === ";") { i++; continue; }
    if (c === "'") {
      let end = i + 1;
      while (end < sql.length && sql[end] !== "'") end++;
      if (end >= sql.length) throw new Error("Unterminated string literal");
      tokens.push({ type: "string", value: sql.substring(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "-" && /[0-9]/.test(sql[i + 1] || ""))) {
      let end = i + (c === "-" ? 1 : 0);
      while (end < sql.length && /[0-9.]/.test(sql[end])) end++;
      tokens.push({ type: "number", value: parseFloat(sql.substring(i, end)) });
      i = end;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let end = i;
      while (end < sql.length && /[a-zA-Z0-9_]/.test(sql[end])) end++;
      tokens.push({ type: "ident", value: sql.substring(i, end).toLowerCase(), raw: sql.substring(i, end) });
      i = end;
      continue;
    }
    if (c === "*") { tokens.push({ type: "star" }); i++; continue; }
    if (c === ",") { tokens.push({ type: "comma" }); i++; continue; }
    if (c === "(") { tokens.push({ type: "lparen" }); i++; continue; }
    if (c === ")") { tokens.push({ type: "rparen" }); i++; continue; }
    if (c === "!" && sql[i + 1] === "=") { tokens.push({ type: "op", value: "!=" }); i += 2; continue; }
    if (c === "<" && sql[i + 1] === ">") { tokens.push({ type: "op", value: "!=" }); i += 2; continue; }
    if ((c === ">" || c === "<") && sql[i + 1] === "=") { tokens.push({ type: "op", value: c + "=" }); i += 2; continue; }
    if (c === "=" || c === ">" || c === "<") { tokens.push({ type: "op", value: c }); i++; continue; }
    throw new Error(`Unexpected character: ${c}`);
  }
  return tokens;
}

function parseQuery(sql) {
  const tokens = tokenize(sql);
  let pos = 0;
  const peek = (n = 0) => tokens[pos + n];
  const consume = () => tokens[pos++];

  const expectKeyword = (kw) => {
    const t = peek();
    if (!t || t.type !== "ident" || t.value !== kw) {
      throw new Error(`Expected ${kw.toUpperCase()}, got ${t ? (t.raw || t.value || t.type) : "end of input"}`);
    }
    pos++;
  };

  const isKw = (kw, offset = 0) => {
    const t = peek(offset);
    return !!(t && t.type === "ident" && t.value === kw);
  };

  expectKeyword("select");

  let distinct = false;
  if (isKw("distinct")) { consume(); distinct = true; }

  const columns = [];
  const aliases = {};
  if (peek() && peek().type === "star") {
    consume();
    columns.push("*");
  } else {
    while (true) {
      const t = peek();
      if (!t || t.type !== "ident") throw new Error("Expected column name");
      const colName = consume().value;
      columns.push(colName);
      if (isKw("as")) {
        consume();
        const aliasTok = peek();
        if (!aliasTok || aliasTok.type !== "ident") throw new Error("Expected alias after AS");
        consume();
        aliases[colName] = aliasTok.value;
      }
      if (peek() && peek().type === "comma") { consume(); continue; }
      break;
    }
  }

  expectKeyword("from");
  const tableTok = peek();
  if (!tableTok || tableTok.type !== "ident") throw new Error("Expected table name");
  const table = consume().value;

  let where = null;
  if (isKw("where")) {
    consume();
    where = parseOr();
  }

  let orderBy = null;
  if (isKw("order")) {
    consume();
    if (!isKw("by")) throw new Error("Expected BY after ORDER");
    consume();
    orderBy = [];
    while (true) {
      const colTok = peek();
      if (!colTok || colTok.type !== "ident") throw new Error("Expected column name in ORDER BY");
      consume();
      let direction = "asc";
      if (isKw("asc")) { consume(); }
      else if (isKw("desc")) { consume(); direction = "desc"; }
      orderBy.push({ column: colTok.value, direction });
      if (peek() && peek().type === "comma") { consume(); continue; }
      break;
    }
  }

  let limit = null;
  if (isKw("limit")) {
    consume();
    const numTok = peek();
    if (!numTok || numTok.type !== "number") throw new Error("LIMIT expects a number");
    consume();
    if (numTok.value < 0) throw new Error("LIMIT must be non-negative");
    limit = Math.floor(numTok.value);
  }

  if (peek()) throw new Error(`Unexpected token after query: ${peek().raw || peek().value || peek().type}`);

  function parseOr() {
    let left = parseAnd();
    while (peek() && peek().type === "ident" && peek().value === "or") {
      consume();
      const right = parseAnd();
      left = { type: "or", left, right };
    }
    return left;
  }
  function parseAnd() {
    let left = parseNot();
    while (peek() && peek().type === "ident" && peek().value === "and") {
      consume();
      const right = parseNot();
      left = { type: "and", left, right };
    }
    return left;
  }
  function parseNot() {
    if (peek() && peek().type === "ident" && peek().value === "not") {
      consume();
      return { type: "not", expr: parseCondition() };
    }
    return parseCondition();
  }
  function parseCondition() {
    if (peek() && peek().type === "lparen") {
      consume();
      const expr = parseOr();
      if (!peek() || peek().type !== "rparen") throw new Error("Expected )");
      consume();
      return expr;
    }
    const leftTok = consume();
    if (!leftTok || leftTok.type !== "ident") throw new Error("Expected column name in condition");
    const col = leftTok.value;
    const next = peek();
    if (!next) throw new Error(`Expected condition after ${col}`);

    if (next.type === "ident" && next.value === "is") {
      consume();
      let negate = false;
      if (peek() && peek().type === "ident" && peek().value === "not") { consume(); negate = true; }
      if (!peek() || peek().type !== "ident" || peek().value !== "null") throw new Error("Expected NULL");
      consume();
      return { type: "is_null", column: col, negate };
    }
    if (next.type === "ident" && next.value === "like") {
      consume();
      const pat = consume();
      if (!pat || pat.type !== "string") throw new Error("LIKE expects a string pattern");
      return { type: "like", column: col, pattern: pat.value };
    }
    if (next.type === "ident" && next.value === "between") {
      consume();
      const low = consume();
      if (!low || (low.type !== "number" && low.type !== "string")) throw new Error("BETWEEN expects a value");
      if (!peek() || peek().type !== "ident" || peek().value !== "and") throw new Error("Expected AND in BETWEEN");
      consume();
      const high = consume();
      if (!high || (high.type !== "number" && high.type !== "string")) throw new Error("BETWEEN expects a value");
      return { type: "between", column: col, low: low.value, high: high.value };
    }
    if ((next.type === "ident" && next.value === "in") ||
        (next.type === "ident" && next.value === "not" && peek(1) && peek(1).value === "in")) {
      let negate = false;
      if (next.value === "not") { consume(); negate = true; }
      consume(); // in
      if (!peek() || peek().type !== "lparen") throw new Error("Expected ( after IN");
      consume();
      const values = [];
      while (peek() && peek().type !== "rparen") {
        const t = consume();
        if (t.type !== "number" && t.type !== "string") throw new Error("IN expects literals");
        values.push(t.value);
        if (peek() && peek().type === "comma") consume();
      }
      if (!peek() || peek().type !== "rparen") throw new Error("Expected ) after IN list");
      consume();
      return { type: negate ? "not_in" : "in", column: col, values };
    }
    if (next.type === "op") {
      consume();
      const right = consume();
      if (!right) throw new Error("Expected literal on right side of comparison");
      // Allow NULL as the RHS so `col = NULL` parses (and silently matches nothing,
      // mirroring real SQL semantics). The WRONG TOOL "= NULL" trap relies on this.
      if (right.type === "ident" && right.value === "null") {
        return { type: "compare", column: col, op: next.value, value: null };
      }
      if (right.type !== "number" && right.type !== "string") throw new Error("Expected literal on right side of comparison");
      return { type: "compare", column: col, op: next.value, value: right.value };
    }
    throw new Error(`Unexpected token in condition: ${next.raw || next.value || next.type}`);
  }

  return { columns, aliases, table, where, orderBy, limit, distinct };
}

function sortRowsBy(rows, orderBy) {
  return [...rows].sort((a, b) => {
    for (const { column, direction } of orderBy) {
      const av = a[column];
      const bv = b[column];
      if (av == null && bv == null) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return direction === "desc" ? 1 : -1;
      if (av > bv) return direction === "desc" ? -1 : 1;
    }
    return 0;
  });
}

function evalExpr(expr, row) {
  switch (expr.type) {
    case "and": return evalExpr(expr.left, row) && evalExpr(expr.right, row);
    case "or":  return evalExpr(expr.left, row) || evalExpr(expr.right, row);
    case "not": return !evalExpr(expr.expr, row);
    case "compare": {
      const v = row[expr.column];
      if (v == null) return false; // NULL fails every comparison
      switch (expr.op) {
        case "=":  return v === expr.value;
        case "!=": return v !== expr.value;
        case ">":  return v >  expr.value;
        case "<":  return v <  expr.value;
        case ">=": return v >= expr.value;
        case "<=": return v <= expr.value;
        default: return false;
      }
    }
    case "is_null": {
      const isNull = row[expr.column] == null;
      return expr.negate ? !isNull : isNull;
    }
    case "like": {
      const v = row[expr.column];
      if (v == null) return false;
      const pat = String(expr.pattern)
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".");
      return new RegExp("^" + pat + "$", "i").test(String(v));
    }
    case "in":     return expr.values.includes(row[expr.column]);
    case "not_in": return !expr.values.includes(row[expr.column]);
    case "between": {
      const v = row[expr.column];
      if (v == null) return false;
      return v >= expr.low && v <= expr.high;
    }
    default: return false;
  }
}

function executeQuery(sql, tables) {
  const parsed = parseQuery(sql);
  const source = tables[parsed.table];
  if (!source) throw new Error(`Unknown table: ${parsed.table}`);

  let rows = source;
  if (parsed.where) rows = rows.filter((row) => evalExpr(parsed.where, row));

  let srcCols;
  if (parsed.columns.length === 1 && parsed.columns[0] === "*") {
    srcCols = source.length ? Object.keys(source[0]) : [];
  } else {
    for (const c of parsed.columns) {
      if (source.length && !(c in source[0])) throw new Error(`Unknown column: ${c}`);
    }
    srcCols = parsed.columns;
  }

  // Output column names rename source columns via parsed.aliases (e.g.
  // `imdb_rating AS rating` → output key is "rating"). The original source
  // names are still used to read values from rows.
  const aliases = parsed.aliases || {};
  const outCols = srcCols.map((c) => aliases[c] || c);

  let outRows = rows.map((row) => {
    const o = {};
    for (let i = 0; i < srcCols.length; i++) {
      o[outCols[i]] = row[srcCols[i]];
    }
    return o;
  });

  if (parsed.distinct) {
    const seen = new Set();
    outRows = outRows.filter((row) => {
      const key = rowKey(row, outCols);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (parsed.orderBy && parsed.orderBy.length) {
    for (const { column } of parsed.orderBy) {
      if (!outCols.includes(column)) {
        throw new Error(`ORDER BY column "${column}" must be in the SELECT list`);
      }
    }
    outRows = sortRowsBy(outRows, parsed.orderBy);
  }

  if (parsed.limit != null) {
    outRows = outRows.slice(0, parsed.limit);
  }

  return { columns: outCols, rows: outRows };
}

// ============================================================
// RESULT COMPARISON — column-set + row-multiset
// ============================================================

function rowKey(row, cols) {
  return cols.map((c) => (row[c] == null ? " NULL" : String(row[c]))).join("");
}

function compareResults(actual, expected) {
  if (!actual || !expected) return false;
  if (actual.columns.length !== expected.columns.length) return false;
  const aSet = new Set(actual.columns);
  for (const c of expected.columns) if (!aSet.has(c)) return false;
  if (actual.rows.length !== expected.rows.length) return false;

  const cols = expected.columns;
  const aKeys = actual.rows.map((r) => rowKey(r, cols)).sort();
  const eKeys = expected.rows.map((r) => rowKey(r, cols)).sort();
  for (let i = 0; i < aKeys.length; i++) if (aKeys[i] !== eKeys[i]) return false;
  return true;
}

// Order-sensitive comparison used by PREDICT challenges.
// Returns a diagnostic object so we can give granular feedback.
// `orderMatters` is true only when the target query has an ORDER BY clause —
// otherwise SQL row order is unspecified and we don't punish the learner for it.
function diagnosePredict(builderCols, builderRowIdx, sourceRows, expected, orderMatters = true) {
  const expCols = expected.columns;
  const expRows = expected.rows;

  // Step 1: columns
  if (builderCols.length === 0) {
    return { ok: false, kind: "no_columns", message: "No columns selected — pick the columns the query returns.", expectedColumns: expCols };
  }
  const expColSet = new Set(expCols);
  const userColSet = new Set(builderCols);
  const missingCols = expCols.filter((c) => !userColSet.has(c));
  const extraCols = builderCols.filter((c) => !expColSet.has(c));
  if (missingCols.length || extraCols.length) {
    return {
      ok: false,
      kind: "wrong_columns",
      message: "Wrong columns.",
      missingColumns: missingCols,
      extraColumns: extraCols,
      expectedColumns: expCols,
    };
  }
  // Same set; check order
  const sameOrder = builderCols.length === expCols.length && builderCols.every((c, i) => c === expCols[i]);
  if (!sameOrder) {
    return {
      ok: false,
      kind: "wrong_column_order",
      message: "Right columns, wrong order.",
      expectedColumns: expCols,
    };
  }

  // Step 2: rows. Project source rows onto the expected columns.
  const userRows = builderRowIdx.map((i) => {
    const o = {};
    for (const c of expCols) o[c] = sourceRows[i][c];
    return o;
  });

  if (userRows.length !== expRows.length) {
    return {
      ok: false,
      kind: "wrong_row_count",
      message: `Expected ${expRows.length} row${expRows.length === 1 ? "" : "s"}, you have ${userRows.length}.`,
      expectedRowCount: expRows.length,
      userRowCount: userRows.length,
    };
  }

  // Multiset compare (same rows regardless of order?)
  const userKeys = userRows.map((r) => rowKey(r, expCols));
  const expKeys = expRows.map((r) => rowKey(r, expCols));
  const userSorted = [...userKeys].sort();
  const expSorted = [...expKeys].sort();
  let multisetMatch = userSorted.length === expSorted.length;
  if (multisetMatch) {
    for (let i = 0; i < userSorted.length; i++) {
      if (userSorted[i] !== expSorted[i]) { multisetMatch = false; break; }
    }
  }
  if (!multisetMatch) {
    return {
      ok: false,
      kind: "wrong_rows",
      message: "Your rows don't match the result of the query.",
    };
  }

  // Same set; check order only if the query specifies one.
  if (orderMatters) {
    const orderMatches = userKeys.every((k, i) => k === expKeys[i]);
    if (!orderMatches) {
      return {
        ok: false,
        kind: "wrong_row_order",
        message: "Right rows, wrong order — check the sort (ORDER BY).",
      };
    }
  }

  return { ok: true };
}

// ============================================================
// SYNTAX HIGHLIGHTING
// ============================================================

const SQL_KEYWORDS = [
  "select", "from", "where", "and", "or", "not", "is", "null", "like", "in", "between",
  "order", "by", "group", "having", "limit", "offset", "asc", "desc", "distinct",
  "join", "on", "inner", "left", "right", "outer", "full", "cross", "as",
  "case", "when", "then", "else", "end", "union", "all", "exists",
];
const KW_RE = new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi");

function tokenizeForHighlight(text) {
  // Single pass: strings, numbers, keywords, rest
  const out = [];
  const re = /('[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) out.push({ k: "string", v: m[1] });
    else if (m[2]) out.push({ k: "number", v: m[2] });
    else if (m[3]) {
      out.push({ k: SQL_KEYWORDS.includes(m[3].toLowerCase()) ? "kw" : "ident", v: m[3] });
    } else {
      // collapse runs of whitespace/punctuation into single text node when consecutive
      const last = out[out.length - 1];
      if (last && last.k === "text") last.v += m[4];
      else out.push({ k: "text", v: m[4] });
    }
  }
  return out;
}

function HighlightedSql({ text }) {
  const tokens = tokenizeForHighlight(text);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.k === "kw")     return <span key={i} className="text-cyan-400 font-semibold">{t.v}</span>;
        if (t.k === "string") return <span key={i} className="text-emerald-400">{t.v}</span>;
        if (t.k === "number") return <span key={i} className="text-amber-400">{t.v}</span>;
        return <span key={i}>{t.v}</span>;
      })}
      {/* trailing space so a final newline still renders a line */}
      {"\n"}
    </>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// ============================================================
// GEM RENDERING — SVG shapes drawn per gem.shape, opacity per level.
// ============================================================

function GemShape({ shape, color, size = 24 }) {
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

function GemBadge({ gem, level, locked, justLeveled }) {
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

function GemBelt({ gems, recentLevelUp }) {
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

// ============================================================
// SYNTAX SHELF — collapsible templates beneath the SQL editor.
// Each template fades / shortens as its gem brightens.
// ============================================================

function SyntaxShelf({ gems }) {
  const [open, setOpen] = useState(false);
  const visible = SYNTAX_TEMPLATES.filter((t) => (gems[t.gemId] || 0) < 4);
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
            const level = gems[t.gemId] || 0;
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

function LayerMap({ layers, challenges, currentChallengeIdx, completedIds, onSelectChallenge, onResetProgress }) {
  return (
    <aside className="w-64 shrink-0 border-r border-stone-800 bg-stone-950/60 p-4 overflow-y-auto flex flex-col">
      <div className="text-xs uppercase tracking-widest text-stone-500 mb-3">The Mine</div>
      <ol className="space-y-3 flex-1">
        {layers.map((layer) => {
          const isCurrent = layer.num === challenges[currentChallengeIdx].layer;
          const layerChallenges = challenges.filter((c) => c.layer === layer.num);
          return (
            <li key={layer.num} className={`rounded-md border ${layer.unlocked ? "border-stone-800 bg-stone-900/40" : "border-stone-900 bg-stone-950/40"}`}>
              <div className="px-3 py-2 flex items-center gap-2">
                {layer.unlocked ? (
                  <Pickaxe size={14} className={isCurrent ? "text-amber-400" : "text-stone-500"} />
                ) : (
                  <Lock size={14} className="text-stone-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${layer.unlocked ? "text-stone-200" : "text-stone-600"}`}>
                    Layer {layer.num}: {layer.name}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">{layer.subtitle}</div>
                </div>
              </div>
              {layer.unlocked && (
                <ul className="px-2 pb-2 space-y-1">
                  {layerChallenges.map((ch) => {
                    const idx = challenges.indexOf(ch);
                    const done = completedIds.includes(ch.id);
                    const active = idx === currentChallengeIdx;
                    return (
                      <li key={ch.id}>
                        <button
                          onClick={() => onSelectChallenge(idx)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                            active
                              ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30"
                              : "text-stone-400 hover:bg-stone-900 hover:text-stone-200"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                            done ? "bg-emerald-500/20 text-emerald-300" : active ? "bg-amber-500/20 text-amber-300" : "bg-stone-800 text-stone-500"
                          }`}>
                            {done ? <Check size={10} /> : ch.id.split(".")[1]}
                          </span>
                          <span className="truncate">{ch.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!layer.unlocked && (
                <div className="px-3 pb-3 text-[11px] text-stone-600 italic">This vein runs deeper — keep mining.</div>
              )}
            </li>
          );
        })}
      </ol>
      {onResetProgress && (
        <button
          onClick={onResetProgress}
          className="mt-4 text-[11px] text-stone-500 hover:text-rose-300 border border-stone-800 hover:border-rose-500/40 rounded px-2 py-1.5 transition-colors"
          title="Wipe all gems, completed challenges, and persisted progress."
        >
          Reset progress
        </button>
      )}
    </aside>
  );
}

function formatCell(value) {
  if (value == null) return null; // sentinel for NULL rendering
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  return String(value);
}

function isNumericColumn(rows, col) {
  for (const r of rows) {
    if (r[col] != null) return typeof r[col] === "number";
  }
  return false;
}

function DataTable({
  title,
  columns,
  rows,
  variant = "source",
  maxHeight = "max-h-72",
  selectedRowIndices = null,
  onRowClick = null,
}) {
  const isTarget = variant === "target";
  const clickable = typeof onRowClick === "function";
  const selectedSet = useMemo(() => {
    if (!selectedRowIndices) return null;
    return selectedRowIndices instanceof Set ? selectedRowIndices : new Set(selectedRowIndices);
  }, [selectedRowIndices]);

  return (
    <section
      className={`rounded-lg border ${isTarget ? "border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]" : "border-stone-800"} bg-stone-900/50 overflow-hidden`}
    >
      <header className={`px-3 py-2 flex items-center justify-between border-b ${isTarget ? "border-amber-500/30 bg-amber-500/5" : "border-stone-800 bg-stone-900/80"}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-widest ${isTarget ? "text-amber-300" : "text-stone-500"}`}>
            {isTarget ? "Target" : "Source"}
          </span>
          <span className="text-sm text-stone-200 font-medium">{title}</span>
          {clickable && (
            <span className="text-[10px] text-cyan-300/80 italic ml-1">click rows to pick</span>
          )}
        </div>
        <span className="text-[11px] text-stone-500">
          {rows.length} row{rows.length === 1 ? "" : "s"} · {columns.length} col{columns.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-stone-950">
              {columns.map((c) => {
                const num = isNumericColumn(rows, c);
                return (
                  <th
                    key={c}
                    className={`px-3 py-2 font-mono font-semibold text-stone-400 border-b border-stone-800 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                  >
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-stone-600 italic" colSpan={columns.length || 1}>
                  (no rows)
                </td>
              </tr>
            )}
            {rows.map((row, ri) => {
              const selected = selectedSet ? selectedSet.has(ri) : false;
              const baseBg = ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20";
              const rowClass = [
                baseBg,
                clickable ? "cursor-pointer hover:bg-cyan-500/10 transition-colors" : "",
                selected ? "ring-1 ring-amber-400/40" : "",
              ].join(" ");
              return (
                <tr
                  key={ri}
                  className={rowClass}
                  onClick={clickable ? () => onRowClick(ri) : undefined}
                  style={selected ? { boxShadow: "inset 4px 0 0 0 rgb(251,191,36)" } : undefined}
                >
                  {columns.map((c) => {
                    const v = row[c];
                    const num = isNumericColumn(rows, c);
                    const display = formatCell(v);
                    return (
                      <td
                        key={c}
                        className={`px-3 py-1.5 border-b border-stone-800/50 align-top ${num ? "text-right tabular-nums" : "text-left"}`}
                      >
                        {display === null ? (
                          <span
                            className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle"
                            title="NULL"
                          />
                        ) : (
                          <span className="text-stone-200 whitespace-pre">{display}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SqlEditor({ value, onChange, onSubmit, status, errorMessage, submitDisabled }) {
  const textareaRef = useRef(null);
  const lineCount = Math.max(value.split("\n").length, 4);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

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

function WhyPanel({ why, onNext, hasNext }) {
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
            End of Phase 1 — more veins ahead.
          </div>
        )}
      </div>
    </section>
  );
}

function ResultComparison({ actual, expected, errorMessage }) {
  return (
    <section className="rounded-lg border border-rose-500/40 bg-rose-950/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-rose-300 text-sm font-semibold">Not yet — compare and re-forge.</span>
        {errorMessage && <span className="text-xs text-rose-400">({errorMessage})</span>}
      </div>
      {actual && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DataTable title="Your result" columns={actual.columns} rows={actual.rows} variant="source" maxHeight="max-h-64" />
          <DataTable title="Expected" columns={expected.columns} rows={expected.rows} variant="target" maxHeight="max-h-64" />
        </div>
      )}
    </section>
  );
}

// ============================================================
// ANIMATION STAGE
// Plays the WHERE → SELECT → ORDER BY → LIMIT transformation
// on a copy of the source table after a correct submission.
// ============================================================

const PHASE_LABEL = {
  filtering:    "WHERE — filtering rows",
  selecting:    "SELECT — choosing columns",
  distincting:  "DISTINCT — removing duplicates",
  sorting:      "ORDER BY — sorting",
  limiting:     "LIMIT — taking top N",
  complete:     "transformation complete",
};

function computeFirstPhase(parsed, allColumns) {
  if (parsed.where) return "filtering";
  if (!(parsed.columns.length === 1 && parsed.columns[0] === "*") &&
      parsed.columns.length < allColumns.length) return "selecting";
  if (parsed.distinct) return "distincting";
  if (parsed.orderBy && parsed.orderBy.length) return "sorting";
  if (parsed.limit != null) return "limiting";
  return null;
}

function AnimationStage({ parsed, sourceColumns, sourceRows, onPhaseChange }) {
  // Local visual state. rowOrder holds source-row indices in current visual order.
  const initialOrder = useMemo(() => sourceRows.map((_, i) => i), [sourceRows]);
  const [rowOrder, setRowOrder]         = useState(initialOrder);
  const [hiddenRows, setHiddenRows]     = useState(() => new Set());
  const [collapsedCols, setCollapsedCols] = useState(() => new Set());
  const [rowOffsets, setRowOffsets]     = useState({});  // sourceIdx -> px
  const [lifted, setLifted]             = useState(false);
  const [phase, setPhase]               = useState("init");

  // Drive the phase sequence once on mount.
  useEffect(() => {
    let cancelled = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    const announce = (p) => {
      setPhase(p);
      onPhaseChange(p);
    };

    (async () => {
      let currentOrder = initialOrder.slice();
      const ROW_HEIGHT = 30; // px — matches tr height set below

      // 1) FILTER
      if (parsed.where) {
        announce("filtering");
        const drop = new Set();
        sourceRows.forEach((r, i) => {
          if (!evalExpr(parsed.where, r)) drop.add(i);
        });
        setHiddenRows(drop);
        const maxStagger = Math.max(0, drop.size - 1) * 50;
        await wait(400 + maxStagger + 300);
        if (cancelled) return;
        currentOrder = currentOrder.filter((i) => !drop.has(i));
        setRowOrder(currentOrder);
        await wait(80);
        if (cancelled) return;
      }

      // 2) SELECT
      const selectingAll =
        parsed.columns.length === 1 && parsed.columns[0] === "*";
      if (!selectingAll && parsed.columns.length < sourceColumns.length) {
        announce("selecting");
        const collapse = new Set(
          sourceColumns.filter((c) => !parsed.columns.includes(c))
        );
        setCollapsedCols(collapse);
        await wait(400 + 200);
        if (cancelled) return;
      }

      // 2.5) DISTINCT — runs after SELECT projection, before ORDER BY.
      // Drop later rows whose visible-column values duplicate an earlier row.
      if (parsed.distinct) {
        announce("distincting");
        const visibleSrc =
          parsed.columns.length === 1 && parsed.columns[0] === "*"
            ? sourceColumns
            : parsed.columns;
        const seen = new Set();
        const dropDup = new Set();
        for (const srcIdx of currentOrder) {
          const r = sourceRows[srcIdx];
          const key = visibleSrc
            .map((c) => (r[c] == null ? " NULL" : String(r[c])))
            .join("");
          if (seen.has(key)) dropDup.add(srcIdx);
          else seen.add(key);
        }
        if (dropDup.size > 0) {
          setHiddenRows((prev) => {
            const next = new Set(prev);
            dropDup.forEach((i) => next.add(i));
            return next;
          });
          const maxStagger = Math.max(0, dropDup.size - 1) * 50;
          await wait(400 + maxStagger + 300);
          if (cancelled) return;
          currentOrder = currentOrder.filter((i) => !dropDup.has(i));
          setRowOrder(currentOrder);
          await wait(80);
        } else {
          await wait(400);
        }
        if (cancelled) return;
      }

      // 3) ORDER BY
      if (parsed.orderBy && parsed.orderBy.length) {
        announce("sorting");
        const sortedOrder = [...currentOrder].sort((a, b) => {
          for (const { column, direction } of parsed.orderBy) {
            const av = sourceRows[a][column];
            const bv = sourceRows[b][column];
            if (av == null && bv == null) continue;
            if (av == null) return 1;
            if (bv == null) return -1;
            if (av < bv) return direction === "desc" ? 1 : -1;
            if (av > bv) return direction === "desc" ? -1 : 1;
          }
          return 0;
        });

        const oldPos = {};
        currentOrder.forEach((idx, vi) => { oldPos[idx] = vi; });
        const newPos = {};
        sortedOrder.forEach((idx, vi) => { newPos[idx] = vi; });

        // Lift step: short transition (~200ms) — handled by `rowTransitionFor`.
        setLifted(true);
        await wait(220);
        if (cancelled) return;

        // Translate step: 600ms ease-in-out.
        const offsets = {};
        currentOrder.forEach((idx) => {
          offsets[idx] = (newPos[idx] - oldPos[idx]) * ROW_HEIGHT;
        });
        setRowOffsets(offsets);
        await wait(620);
        if (cancelled) return;

        // Settle: swap the array, drop offsets/lift instantly (no transition).
        setPhase("settling");          // disables transitions for the snap
        setRowOrder(sortedOrder);
        setRowOffsets({});
        setLifted(false);
        currentOrder = sortedOrder;
        await wait(60);
        if (cancelled) return;
      }

      // 4) LIMIT
      if (parsed.limit != null && parsed.limit < currentOrder.length) {
        announce("limiting");
        const toDrop = currentOrder.slice(parsed.limit);
        setHiddenRows((prev) => {
          const next = new Set(prev);
          toDrop.forEach((i) => next.add(i));
          return next;
        });
        const maxStagger = Math.max(0, toDrop.length - 1) * 50;
        await wait(400 + maxStagger + 200);
        if (cancelled) return;
        currentOrder = currentOrder.slice(0, parsed.limit);
        setRowOrder(currentOrder);
        await wait(80);
        if (cancelled) return;
      }

      announce("complete");
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render: a clone of the source, animated according to the per-row/col state.
  const visibleColumns = sourceColumns;

  // Row transition strategy varies by phase.
  // During 'sorting', the lift uses a fast transform transition; once offsets are
  // applied, the 600ms ease-in-out animates the slide. 'settling' disables
  // transitions so the rowOrder/transform reset happens instantly.
  const rowTransitionFor = (visualIdx) => {
    if (phase === "filtering" || phase === "limiting" || phase === "distincting") {
      const delay = visualIdx * 50;
      return `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`;
    }
    if (phase === "sorting") {
      // Lift sub-step has no offsets yet → small transition is fine. Once
      // offsets are applied, the slide takes 600ms. The 200ms baseline on
      // box-shadow handles the lift's shadow.
      const sliding = Object.keys(rowOffsets).length > 0;
      return sliding
        ? "transform 600ms ease-in-out, box-shadow 200ms ease-out"
        : "transform 200ms ease-out, box-shadow 200ms ease-out";
    }
    if (phase === "settling") return "none";
    return "opacity 200ms ease-out, transform 200ms ease-out";
  };

  const cellTransition =
    "max-width 400ms ease-out, padding 400ms ease-out, opacity 300ms ease-out";

  return (
    <section className="rounded-lg border border-amber-500/40 bg-stone-900/50 overflow-hidden">
      <header className="px-3 py-2 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-amber-300">
            Animation
          </span>
          <span className="text-sm text-stone-200 font-medium">
            {PHASE_LABEL[phase] || "preparing…"}
          </span>
        </div>
      </header>
      <div className="overflow-auto max-h-96">
        <table className="w-full text-xs border-collapse" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0">
            <tr className="bg-stone-950">
              {visibleColumns.map((c) => {
                const num = isNumericColumn(sourceRows, c);
                const collapsed = collapsedCols.has(c);
                return (
                  <th
                    key={c}
                    className={`font-mono font-semibold text-stone-400 border-b border-stone-800 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                    style={{
                      padding: collapsed ? "0px" : "0.5rem 0.75rem",
                      maxWidth: collapsed ? "0px" : "240px",
                      width: collapsed ? "0px" : "auto",
                      opacity: collapsed ? 0 : 1,
                      overflow: "hidden",
                      transition: cellTransition,
                    }}
                  >
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((srcIdx, visualIdx) => {
              const row = sourceRows[srcIdx];
              const isHidden = hiddenRows.has(srcIdx);
              const sortPx = rowOffsets[srcIdx] || 0;
              const liftPx = lifted && !isHidden ? -3 : 0;
              const hidePx = isHidden ? 20 : 0;
              const translate = sortPx + liftPx + hidePx;
              return (
                <tr
                  key={srcIdx}
                  className={visualIdx % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}
                  style={{
                    height: "30px",
                    opacity: isHidden ? 0 : 1,
                    transform: `translateY(${translate}px)`,
                    boxShadow:
                      lifted && !isHidden
                        ? "0 4px 12px rgba(0,0,0,0.45)"
                        : "0 0 0 rgba(0,0,0,0)",
                    transition: rowTransitionFor(visualIdx),
                  }}
                >
                  {visibleColumns.map((c) => {
                    const num = isNumericColumn(sourceRows, c);
                    const collapsed = collapsedCols.has(c);
                    const display = formatCell(row[c]);
                    return (
                      <td
                        key={c}
                        className={`border-b border-stone-800/50 align-middle ${num ? "text-right tabular-nums" : "text-left"}`}
                        style={{
                          padding: collapsed ? "0px" : "0.25rem 0.75rem",
                          maxWidth: collapsed ? "0px" : "240px",
                          width: collapsed ? "0px" : "auto",
                          opacity: collapsed ? 0 : 1,
                          overflow: "hidden",
                          transition: cellTransition,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {display === null ? (
                          <span
                            className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle"
                            title="NULL"
                          />
                        ) : (
                          <span className="text-stone-200">{display}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================
// OPERATION BUILDER — palette, pipeline, reference bar
// ============================================================
//
// Drag state lives in a module-level variable instead of dataTransfer:
// sandboxed iframes (like Claude.ai's artifact preview) silently strip
// custom MIME types from dataTransfer, so a fallback path that reads
// from a shared variable is far more reliable. We still call setData
// with text/plain because some browsers refuse to start a drag without
// any payload.

let activeDrag = null; // { opId, source: "palette" | "pipeline", fromIdx?: number }

function PaletteBlock({ opId, locked }) {
  const op = OPERATIONS[opId];
  const onDragStart = (e) => {
    if (locked) { e.preventDefault(); return; }
    activeDrag = { opId, source: "palette" };
    try { e.dataTransfer.setData("text/plain", opId); } catch {}
    e.dataTransfer.effectAllowed = "copyMove";
  };
  const onDragEnd = () => { activeDrag = null; };
  if (locked) {
    return (
      <div
        title={`Unlocked in Layer ${op.layer}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-800 bg-stone-950/60 text-stone-600 text-xs cursor-not-allowed select-none"
      >
        <span className="opacity-40">{op.icon}</span>
        <span>{op.label}</span>
        <Lock size={11} className="text-stone-700 ml-0.5" />
      </div>
    );
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs cursor-grab active:cursor-grabbing hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-colors select-none"
    >
      <span>{op.icon}</span>
      <span className="font-medium">{op.label}</span>
    </div>
  );
}

function OperationsPalette() {
  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/50 p-3">
      <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">
        Available Operations · drag into the pipeline
      </div>
      <div className="flex flex-wrap gap-2">
        {OPERATIONS_LIST.map((opId) => (
          <PaletteBlock key={opId} opId={opId} locked={OPERATIONS[opId].layer > UNLOCKED_THROUGH_LAYER} />
        ))}
      </div>
    </section>
  );
}

function PipelineSlot({ index, opId, slotStatus, onRemove, onDropOp, isLast, dropHover, onDragOverSlot, onDragLeaveSlot }) {
  const empty = !opId;
  const op = opId ? OPERATIONS[opId] : null;

  const onDragStartFromSlot = (e) => {
    if (empty) return;
    activeDrag = { opId, source: "pipeline", fromIdx: index };
    try { e.dataTransfer.setData("text/plain", opId); } catch {}
    e.dataTransfer.effectAllowed = "copyMove";
  };
  const onDragEndFromSlot = () => { activeDrag = null; };

  const allowDrop = (e) => {
    e.preventDefault();
    // dropEffect must be compatible with effectAllowed; "copy" satisfies "copyMove".
    e.dataTransfer.dropEffect = "copy";
    onDragOverSlot(index);
  };

  // status → border colors
  let borderClass = "border-dashed border-stone-700";
  if (!empty) {
    if (slotStatus === "error")   borderClass = "border-rose-500/70";
    else if (slotStatus === "warning") borderClass = "border-amber-500/60";
    else                          borderClass = "border-emerald-500/60";
  }
  if (dropHover) borderClass = "border-cyan-400/80";

  return (
    <div className="relative">
      <div
        onDragOver={allowDrop}
        onDragLeave={() => onDragLeaveSlot(index)}
        onDrop={(e) => { e.preventDefault(); onDropOp(e, index); onDragLeaveSlot(index); }}
        className={`group relative rounded-lg border-2 ${borderClass} transition-colors ${
          empty ? "bg-stone-950/40" : "bg-stone-900/70"
        }`}
      >
        {empty ? (
          <div className="px-4 py-3 text-xs text-stone-600 italic flex items-center gap-2">
            <Plus size={12} />
            Drop an operation here
          </div>
        ) : (
          <div
            draggable
            onDragStart={onDragStartFromSlot}
            onDragEnd={onDragEndFromSlot}
            className="px-4 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-stone-400 text-[10px] font-mono">
              {index + 1}
            </span>
            <span className="text-lg leading-none">{op.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-stone-100">{op.label}</div>
              <div className="text-[11px] text-stone-500 font-mono">{op.hint}</div>
            </div>
            <button
              onClick={onRemove}
              className="text-stone-500 hover:text-rose-300 transition-colors p-1"
              aria-label="Remove operation"
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Inline status message under filled slot */}
      {!empty && slotStatus && slotStatus !== "ok" && (
        <div
          className={`mt-1 ml-2 text-[11px] flex items-center gap-1.5 ${
            slotStatus === "error" ? "text-rose-300" : "text-amber-300"
          }`}
        >
          <AlertTriangle size={11} />
          <span>{slotStatus === "error" ? "Duplicate block" : "warning"}</span>
        </div>
      )}

      {/* Connector to next block */}
      {!isLast && (
        <div className="flex justify-center py-1">
          <div className={`w-px h-3 ${!empty && slotStatus === "ok" ? "bg-emerald-500/60" : "bg-stone-700"}`} />
        </div>
      )}
    </div>
  );
}

function PipelineBuilder({ pipeline, onChange, validation, expectedPipeline, onConfirm, canConfirm }) {
  const [dropHoverIdx, setDropHoverIdx] = useState(null);

  const handleDrop = (e, idx) => {
    // Primary path: module-level state set during dragstart.
    // Fallback: text/plain payload (in case dragstart happened in a context
    // that mutated/lost the module variable — e.g. fast-refresh during dev).
    let drag = activeDrag;
    if (!drag) {
      const opId = e.dataTransfer.getData("text/plain");
      if (!opId || !OPERATIONS[opId]) return;
      drag = { opId, source: "palette" };
    }
    activeDrag = null;

    if (drag.source === "pipeline") {
      const from = drag.fromIdx;
      if (from == null || from === idx) return;
      const next = [...pipeline];
      const [moved] = next.splice(from, 1);
      const insertAt = from < idx ? idx - 1 : idx;
      next.splice(Math.min(insertAt, next.length), 0, moved);
      onChange(next);
    } else {
      if (!OPERATIONS[drag.opId]) return;
      const next = [...pipeline];
      next.splice(Math.min(idx, next.length), 0, drag.opId);
      onChange(next);
    }
  };

  const handleRemove = (idx) => {
    const next = [...pipeline];
    next.splice(idx, 1);
    onChange(next);
  };

  const addSlot = () => onChange([...pipeline, null]);

  // Render: one slot per pipeline entry, plus one trailing empty slot (so users can always drop at the end).
  const renderedSlots = [...pipeline];
  const trailingEmpty = pipeline.length === 0 || pipeline[pipeline.length - 1] != null;
  if (trailingEmpty) renderedSlots.push(null);

  const matched = pipelineMatchesExpected(pipeline.filter(Boolean), expectedPipeline);

  return (
    <section className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-amber-400" />
          <span className="text-[10px] uppercase tracking-widest text-stone-400">Operation Pipeline</span>
          <span className="text-[11px] text-stone-500 italic">top → bottom = execution order</span>
        </div>
        <span className="text-[11px] text-stone-500">
          {pipeline.filter(Boolean).length} step{pipeline.filter(Boolean).length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="space-y-0">
        {renderedSlots.map((opId, idx) => {
          const slotStatus = opId ? validation.slots[idx]?.status : null;
          return (
            <PipelineSlot
              key={idx}
              index={idx}
              opId={opId}
              slotStatus={slotStatus}
              onRemove={() => handleRemove(idx)}
              onDropOp={handleDrop}
              isLast={idx === renderedSlots.length - 1}
              dropHover={dropHoverIdx === idx}
              onDragOverSlot={setDropHoverIdx}
              onDragLeaveSlot={(i) => setDropHoverIdx((curr) => (curr === i ? null : curr))}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={addSlot}
          className="text-[11px] text-stone-400 hover:text-stone-200 inline-flex items-center gap-1"
        >
          <Plus size={12} /> Add slot
        </button>

        <div className="flex items-center gap-3">
          {/* Inline warning summary */}
          {validation.slots.some((s) => s.status === "warning") && (
            <span className="text-[11px] text-amber-300 italic max-w-md text-right">
              {validation.slots.find((s) => s.status === "warning")?.message}
            </span>
          )}
          {validation.hasErrors && (
            <span className="text-[11px] text-rose-300 italic">
              Fix the duplicate blocks before continuing.
            </span>
          )}
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
            title={
              !matched
                ? "Build the pipeline that matches the target"
                : validation.hasErrors
                ? "Resolve errors first"
                : "Lock in your pipeline and write the SQL"
            }
          >
            Now write the SQL <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}

function PipelineReference({ pipeline, onEdit }) {
  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-center gap-3">
      <Wrench size={12} className="text-amber-400" />
      <span className="text-[10px] uppercase tracking-widest text-amber-300">Pipeline</span>
      <div className="flex items-center gap-1 flex-wrap">
        {pipeline.map((opId, idx) => (
          <span key={idx} className="inline-flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900/70 border border-stone-700 text-[11px] text-stone-200">
              <span>{OPERATIONS[opId].icon}</span>
              <span className="font-medium">{OPERATIONS[opId].label}</span>
            </span>
            {idx < pipeline.length - 1 && <ChevronRight size={11} className="text-stone-500" />}
          </span>
        ))}
      </div>
      <button
        onClick={onEdit}
        className="ml-auto text-[11px] text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
      >
        Edit pipeline
      </button>
    </section>
  );
}

// ============================================================
// PREDICT — query card + ResultBuilder
// ============================================================

function PredictQueryCard({ sql }) {
  return (
    <section className="rounded-lg border border-cyan-500/40 bg-stone-950/70 overflow-hidden mb-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
      <header className="px-3 py-2 border-b border-cyan-500/20 bg-cyan-500/5 flex items-center gap-2">
        <Sparkles size={12} className="text-cyan-300" />
        <span className="text-[10px] uppercase tracking-widest text-cyan-300">Read this query</span>
        <span className="text-[11px] text-stone-500 italic">execute it in your head — then build the result</span>
      </header>
      <pre
        className="px-4 py-3 m-0 text-sm leading-6 whitespace-pre-wrap break-words text-stone-200"
        style={{ fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}
      >
        <HighlightedSql text={sql} />
      </pre>
    </section>
  );
}

function ResultBuilder({
  sourceColumns,
  sourceRows,
  builderCols,
  builderRowIdx,
  onToggleColumn,
  onClearColumns,
  onRemoveRow,
  onMoveRow,
  onClearRows,
  onCheck,
  status,
  feedback,
  disabled,
}) {
  const borderClass =
    status === "correct"
      ? "border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
      : status === "wrong"
      ? "border-rose-500/60 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]"
      : "border-cyan-500/40";

  const hasAnything = builderCols.length > 0 || builderRowIdx.length > 0;

  return (
    <section className={`rounded-lg border-2 ${borderClass} bg-stone-900/50 overflow-hidden transition-shadow`}>
      <header className="px-3 py-2 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-cyan-300">Result Builder</span>
          <span className="text-sm text-stone-200 font-medium">build the result by hand</span>
        </div>
        <span className="text-[11px] text-stone-500">
          {builderRowIdx.length} row{builderRowIdx.length === 1 ? "" : "s"} · {builderCols.length} col{builderCols.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="p-3 space-y-3">
        {/* Column picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">
              Columns · click to add, click again to remove
            </div>
            {builderCols.length > 0 && (
              <button
                onClick={onClearColumns}
                disabled={disabled}
                className="text-[10px] text-stone-500 hover:text-stone-300 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Eraser size={10} /> clear columns
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sourceColumns.map((c) => {
              const orderIdx = builderCols.indexOf(c);
              const selected = orderIdx !== -1;
              return (
                <button
                  key={c}
                  onClick={() => onToggleColumn(c)}
                  disabled={disabled}
                  className={[
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-colors select-none",
                    selected
                      ? "border-amber-400/70 bg-amber-500/15 text-amber-100"
                      : "border-stone-700 bg-stone-900/60 text-stone-400 hover:border-cyan-400/50 hover:text-cyan-200",
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  title={selected ? "Remove column" : "Add column"}
                >
                  {selected && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/30 text-[9px] text-amber-100 font-semibold">
                      {orderIdx + 1}
                    </span>
                  )}
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result grid */}
        <div className="rounded-md border border-cyan-500/30 bg-stone-950/60 overflow-hidden">
          {builderCols.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-stone-600 italic">
              Pick the columns the query returns by clicking the pills above.
            </div>
          ) : builderRowIdx.length === 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-stone-950">
                  {builderCols.map((c) => {
                    const num = isNumericColumn(sourceRows, c);
                    return (
                      <th
                        key={c}
                        className={`px-3 py-2 font-mono font-semibold text-amber-200/80 border-b border-cyan-500/20 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                      >
                        {c}
                      </th>
                    );
                  })}
                  <th className="w-20 border-b border-cyan-500/20" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-6 text-center text-xs text-stone-600 italic" colSpan={builderCols.length + 1}>
                    Now click rows in the source table to add them.
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-stone-950">
                    {builderCols.map((c) => {
                      const num = isNumericColumn(sourceRows, c);
                      return (
                        <th
                          key={c}
                          className={`px-3 py-2 font-mono font-semibold text-amber-200/80 border-b border-cyan-500/20 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                        >
                          {c}
                        </th>
                      );
                    })}
                    <th className="w-20 border-b border-cyan-500/20" />
                  </tr>
                </thead>
                <tbody>
                  {builderRowIdx.map((srcIdx, ri) => {
                    const row = sourceRows[srcIdx];
                    return (
                      <tr key={`${srcIdx}-${ri}`} className={ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}>
                        {builderCols.map((c) => {
                          const num = isNumericColumn(sourceRows, c);
                          const display = formatCell(row[c]);
                          return (
                            <td
                              key={c}
                              className={`px-3 py-1.5 border-b border-stone-800/50 align-middle ${num ? "text-right tabular-nums" : "text-left"}`}
                            >
                              {display === null ? (
                                <span
                                  className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle"
                                  title="NULL"
                                />
                              ) : (
                                <span className="text-stone-200 whitespace-pre">{display}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1 border-b border-stone-800/50 align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => onMoveRow(ri, -1)}
                              disabled={disabled || ri === 0}
                              className="p-1 rounded text-stone-500 hover:text-cyan-300 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                              aria-label="Move up"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              onClick={() => onMoveRow(ri, 1)}
                              disabled={disabled || ri === builderRowIdx.length - 1}
                              className="p-1 rounded text-stone-500 hover:text-cyan-300 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                              aria-label="Move down"
                            >
                              <ChevronDown size={12} />
                            </button>
                            <button
                              onClick={() => onRemoveRow(ri)}
                              disabled={disabled}
                              className="p-1 rounded text-stone-500 hover:text-rose-300 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Remove from result"
                              aria-label="Remove row"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between gap-2">
          <div>
            {builderRowIdx.length > 0 && (
              <button
                onClick={onClearRows}
                disabled={disabled}
                className="text-[10px] text-stone-500 hover:text-stone-300 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Eraser size={10} /> clear rows
              </button>
            )}
          </div>
          <button
            onClick={onCheck}
            disabled={disabled || !hasAnything}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
          >
            <Check size={12} /> Check Result
          </button>
        </div>

        {/* Granular feedback */}
        {feedback && !feedback.ok && (
          <div className="rounded-md border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-xs text-rose-200 space-y-1">
            <div className="font-semibold text-rose-200">{feedback.message}</div>
            {feedback.kind === "wrong_columns" && (
              <div className="text-rose-300/90">
                {feedback.missingColumns?.length > 0 && (
                  <div>Missing: <span className="font-mono text-amber-200">{feedback.missingColumns.join(", ")}</span></div>
                )}
                {feedback.extraColumns?.length > 0 && (
                  <div>Shouldn't be here: <span className="font-mono text-rose-200">{feedback.extraColumns.join(", ")}</span></div>
                )}
              </div>
            )}
            {feedback.kind === "wrong_column_order" && (
              <div className="text-rose-300/90">
                Expected order: <span className="font-mono text-amber-200">{feedback.expectedColumns.join(", ")}</span>
              </div>
            )}
            {feedback.kind === "wrong_rows" && (
              <div className="text-rose-300/90 italic">
                Walk through the WHERE clause row by row — which source rows actually pass it?
              </div>
            )}
            {feedback.kind === "wrong_row_order" && (
              <div className="text-rose-300/90 italic">
                Use the ↑↓ arrows on each row to fix the order.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// WRONG TOOL — hint panel shown after the obvious-wrong query is submitted
// ============================================================

function WrongToolHint({ message }) {
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

// ============================================================
// DIAGNOSE — broken query + wrong/expected + diagnostic options
// ============================================================

function DiagnoseOption({ opt, isSelected, status, isCorrect, onSelect, disabled }) {
  // Visual state:
  //   - idle/unselected: stone border
  //   - idle/selected: cyan border + filled radio
  //   - after correct submit: correct = emerald border + check; wrong-selected = rose border + x
  //   - after wrong submit: selected wrong = rose border + x
  let optClass;
  let circleClass;
  let circleInner = null;
  let trailingIcon = null;

  if (status === "correct") {
    if (isCorrect) {
      optClass = "border-emerald-500/70 bg-emerald-950/20";
      circleClass = "border-emerald-400 bg-emerald-400";
      circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
      trailingIcon = <Check size={14} className="text-emerald-300" />;
    } else if (isSelected) {
      optClass = "border-rose-500/70 bg-rose-950/20";
      circleClass = "border-rose-400 bg-rose-400";
      circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
      trailingIcon = <X size={14} className="text-rose-300" />;
    } else {
      optClass = "border-stone-800 bg-stone-950/40 opacity-60";
      circleClass = "border-stone-600";
    }
  } else if (status === "wrong" && isSelected) {
    optClass = "border-rose-500/70 bg-rose-950/20";
    circleClass = "border-rose-400 bg-rose-400";
    circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
    trailingIcon = <X size={14} className="text-rose-300" />;
  } else if (isSelected) {
    optClass = "border-cyan-400/70 bg-cyan-500/10";
    circleClass = "border-cyan-400 bg-cyan-400";
    circleInner = <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />;
  } else {
    optClass = "border-stone-700 bg-stone-950/40 hover:border-cyan-500/40 hover:bg-stone-900/70";
    circleClass = "border-stone-600";
  }

  return (
    <button
      onClick={() => !disabled && onSelect(opt.id)}
      disabled={disabled}
      className={`w-full text-left rounded-md border-2 px-3 py-2.5 flex items-start gap-3 transition-colors ${optClass} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 ${circleClass}`}>
        {circleInner}
      </span>
      <span className="text-sm text-stone-200 leading-relaxed flex-1">{opt.text}</span>
      {trailingIcon && <span className="shrink-0 mt-0.5">{trailingIcon}</span>}
    </button>
  );
}

function DiagnoseChallenge({
  challenge,
  sourceColumns,
  sourceRows,
  selectedId,
  onSelect,
  onDiagnose,
  status,
}) {
  const brokenResult = useMemo(() => {
    try {
      return { result: executeQuery(challenge.brokenSql, TABLES), error: null };
    } catch (e) {
      return { result: null, error: e.message || String(e) };
    }
  }, [challenge.brokenSql]);

  const expected = useMemo(() => {
    try {
      return executeQuery(challenge.targetSql, TABLES);
    } catch {
      return { columns: [], rows: [] };
    }
  }, [challenge.targetSql]);

  const locked = status === "correct";
  const optionsBorder =
    status === "correct"
      ? "border-emerald-500/60 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
      : status === "wrong"
      ? "border-rose-500/60 sf-shake"
      : "border-stone-800";

  return (
    <>
      {/* Broken SQL — rose-themed card */}
      <section className="rounded-lg border border-rose-500/40 bg-rose-950/20 overflow-hidden mb-4 shadow-[0_0_0_1px_rgba(244,63,94,0.08)]">
        <header className="px-3 py-2 border-b border-rose-500/30 bg-rose-500/5 flex items-center gap-2">
          <AlertTriangle size={12} className="text-rose-300" />
          <span className="text-[10px] uppercase tracking-widest text-rose-300">Broken Query</span>
          <span className="text-[11px] text-stone-500 italic">this query produces the wrong result — figure out why</span>
        </header>
        <pre
          className="px-4 py-3 m-0 text-sm leading-6 whitespace-pre-wrap break-words text-stone-200"
          style={{ fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}
        >
          <HighlightedSql text={challenge.brokenSql} />
        </pre>
      </section>

      {/* Source table — full width above the comparison */}
      <div className="mb-4">
        <DataTable title="shows" columns={sourceColumns} rows={sourceRows} variant="source" maxHeight="max-h-64" />
      </div>

      {/* Wrong + Expected side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {brokenResult.error ? (
          <section className="rounded-lg border border-rose-500/50 bg-rose-950/10 overflow-hidden">
            <header className="px-3 py-2 border-b border-rose-500/30 bg-rose-500/5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-rose-300">Wrong Result</span>
              <span className="text-sm text-stone-200 font-medium">query errored</span>
            </header>
            <div className="px-3 py-4 text-sm text-rose-200">
              <span className="font-semibold">Query Error:</span> {brokenResult.error}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-rose-500/50 bg-rose-950/10 overflow-hidden">
            <header className="px-3 py-2 flex items-center justify-between border-b border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-rose-300">Wrong Result</span>
                <span className="text-sm text-stone-200 font-medium">what the broken query returns</span>
              </div>
              <span className="text-[11px] text-stone-500">
                {brokenResult.result.rows.length} row{brokenResult.result.rows.length === 1 ? "" : "s"} · {brokenResult.result.columns.length} col{brokenResult.result.columns.length === 1 ? "" : "s"}
              </span>
            </header>
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-stone-950">
                    {brokenResult.result.columns.map((c) => {
                      const num = isNumericColumn(brokenResult.result.rows, c);
                      return (
                        <th
                          key={c}
                          className={`px-3 py-2 font-mono font-semibold text-rose-200/80 border-b border-rose-500/20 whitespace-nowrap ${num ? "text-right" : "text-left"}`}
                        >
                          {c}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {brokenResult.result.rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-stone-600 italic" colSpan={Math.max(brokenResult.result.columns.length, 1)}>
                        (no rows)
                      </td>
                    </tr>
                  )}
                  {brokenResult.result.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-stone-900/40" : "bg-stone-900/20"}>
                      {brokenResult.result.columns.map((c) => {
                        const num = isNumericColumn(brokenResult.result.rows, c);
                        const display = formatCell(row[c]);
                        return (
                          <td
                            key={c}
                            className={`px-3 py-1.5 border-b border-stone-800/50 align-top ${num ? "text-right tabular-nums" : "text-left"}`}
                          >
                            {display === null ? (
                              <span className="inline-block w-10 h-3 rounded-sm border border-dashed border-stone-700 bg-stone-950/70 align-middle" title="NULL" />
                            ) : (
                              <span className="text-stone-200 whitespace-pre">{display}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <DataTable
          title="expected result"
          columns={expected.columns}
          rows={expected.rows}
          variant="target"
          maxHeight="max-h-64"
        />
      </div>

      {/* Diagnostic options */}
      <section className={`rounded-lg border-2 ${optionsBorder} bg-stone-900/50 p-3 mb-4 transition-shadow`}>
        <header className="mb-3 flex items-center gap-2">
          <Stethoscope size={14} className="text-cyan-300" />
          <span className="text-[10px] uppercase tracking-widest text-cyan-300">Diagnosis</span>
          <span className="text-sm text-stone-200 font-medium">what's wrong with this query?</span>
        </header>
        <div className="space-y-2">
          {challenge.options.map((opt) => (
            <DiagnoseOption
              key={opt.id}
              opt={opt}
              isSelected={selectedId === opt.id}
              isCorrect={opt.id === challenge.correctOption}
              status={status}
              onSelect={onSelect}
              disabled={locked}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] italic min-h-[1.25rem]">
            {status === "wrong" && (
              <span className="text-rose-300">
                Not quite — think about WHEN in the execution order each clause runs.
              </span>
            )}
          </div>
          <button
            onClick={onDiagnose}
            disabled={!selectedId || locked}
            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-semibold transition-colors disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed"
          >
            <Stethoscope size={12} /> Diagnose
          </button>
        </div>
      </section>
    </>
  );
}

// ============================================================
// PERSISTENCE — window.storage. Guarded so artifacts without it still run.
// ============================================================

const STORAGE_KEY = "sql-forge-state";

function storageAvailable() {
  return typeof window !== "undefined" && window.storage && typeof window.storage.set === "function";
}

async function saveState(state) {
  if (!storageAvailable()) return;
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Storage save failed:", e);
  }
}

async function loadState() {
  if (!storageAvailable()) return null;
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (!result) return null;
    const raw = typeof result === "string" ? result : result.value;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Storage load failed:", e);
    return null;
  }
}

// ============================================================
// MAIN APP
// ============================================================

export default function SqlForge() {
  // load Google Fonts once
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  // Hydrate persisted state from window.storage on mount. Falls through silently
  // if window.storage isn't available or parsing fails — we just start fresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadState();
      if (cancelled) return;
      if (data) {
        if (data.gems && typeof data.gems === "object") {
          setGems((prev) => {
            const next = { ...prev };
            for (const g of GEMS) {
              const v = data.gems[g.id];
              if (typeof v === "number" && v >= 0 && v <= 4) next[g.id] = v;
            }
            return next;
          });
        }
        if (Array.isArray(data.completed)) {
          setCompleted(data.completed.filter((id) => CHALLENGES.some((c) => c.id === id)));
        }
        if (typeof data.currentChallenge === "string") {
          const idx = CHALLENGES.findIndex((c) => c.id === data.currentChallenge);
          if (idx >= 0) setCurrentIdx(idx);
        }
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [queries, setQueries] = useState(() => Object.fromEntries(CHALLENGES.map((c) => [c.id, ""])));
  const [statusById, setStatusById] = useState({}); // id -> "correct" | "wrong"
  const [actualByCurrent, setActualByCurrent] = useState(null);
  const [errorByCurrent, setErrorByCurrent] = useState(null);
  const [completed, setCompleted] = useState([]);

  // Operation Builder state (per challenge)
  const [pipelines, setPipelines] = useState(() => Object.fromEntries(CHALLENGES.map((c) => [c.id, []])));
  const [pipelineConfirmed, setPipelineConfirmed] = useState({}); // id -> boolean
  const editorAnchorRef = useRef(null);

  // PREDICT state — per-challenge builder, current-challenge feedback
  const [predictBuilders, setPredictBuilders] = useState(() =>
    Object.fromEntries(CHALLENGES.map((c) => [c.id, { cols: [], rows: [] }]))
  );
  const [predictFeedback, setPredictFeedback] = useState(null);

  // DIAGNOSE state — per-challenge selected option id
  const [diagnoseSelections, setDiagnoseSelections] = useState(() =>
    Object.fromEntries(CHALLENGES.filter((c) => c.type === "diagnose").map((c) => [c.id, null]))
  );

  // Animation orchestration: phase is reported up by AnimationStage as it runs.
  // 'idle' before/after any animation; sub-phases while running; 'complete' at the end.
  const [animationPhase, setAnimationPhase] = useState("idle");
  const [animationParsed, setAnimationParsed] = useState(null);
  const [skipAnimations, setSkipAnimations] = useState(false);

  // Gem brightness levels: { [gemId]: 0..4 }. Start every gem at 0 (unlit).
  const [gems, setGems] = useState(() => Object.fromEntries(GEMS.map((g) => [g.id, 0])));
  // The gem ID that most recently changed level — drives a brief pop animation.
  const [recentLevelUp, setRecentLevelUp] = useState(null);
  // Defer persistence until after the initial load attempt completes, so we don't
  // overwrite saved state with the fresh defaults on first render.
  const [hydrated, setHydrated] = useState(false);

  const animating =
    animationPhase !== "idle" && animationPhase !== "complete";

  const challenge = CHALLENGES[currentIdx];
  const status = statusById[challenge.id] || "idle";
  const query = queries[challenge.id] || "";

  const isOpBuilder = challenge.type === "operation_builder";
  const isPredict = challenge.type === "predict";
  const isWrongTool = challenge.type === "wrong_tool";
  const isDiagnose = challenge.type === "diagnose";
  const pipeline = pipelines[challenge.id] || [];
  const pipelineFilled = pipeline.filter(Boolean);
  const pipelineValidation = useMemo(() => validatePipeline(pipelineFilled), [pipelineFilled]);
  const pipelineMatches = pipelineMatchesExpected(pipelineFilled, challenge.expectedPipeline);
  const canConfirmPipeline = isOpBuilder && pipelineMatches && !pipelineValidation.hasErrors;
  const isPipelineConfirmed = !!pipelineConfirmed[challenge.id];
  const editorLocked = isOpBuilder && !isPipelineConfirmed;

  const builderState = predictBuilders[challenge.id] || { cols: [], rows: [] };

  const expectedResult = useMemo(() => {
    try {
      return executeQuery(challenge.targetSql, TABLES);
    } catch {
      return { columns: [], rows: [] };
    }
  }, [challenge.targetSql]);

  // For the "source" table panel we always show the full underlying table.
  const sourceColumns = SHOW_COLUMN_ORDER;
  const sourceRows = SHOWS_DATA;

  // Persist gems + completed + current challenge whenever any of them changes.
  // Held until hydration finishes so we don't blow away saved state on first render.
  useEffect(() => {
    if (!hydrated) return;
    saveState({ gems, completed, currentChallenge: challenge.id });
  }, [hydrated, gems, completed, challenge.id]);

  // Earn gems for the just-correctly-solved challenge. Each concept ratchets up
  // to the level its challenge type / breadth warrants. Pop animation triggers
  // for the gem with the largest jump.
  const earnGemsForChallenge = (ch) => {
    if (!ch.concepts || ch.concepts.length === 0) return;
    setGems((prev) => {
      const next = { ...prev };
      let topGain = 0;
      let popId = null;
      for (const concept of ch.concepts) {
        if (!GEM_BY_ID[concept]) continue;
        const before = next[concept] || 0;
        const after = nextGemLevel(before, ch);
        if (after > before) {
          next[concept] = after;
          const gain = after - before;
          if (gain > topGain) { topGain = gain; popId = concept; }
        }
      }
      if (popId) {
        setRecentLevelUp(popId);
        setTimeout(() => setRecentLevelUp((cur) => (cur === popId ? null : cur)), 500);
      }
      return next;
    });
  };

  const handleResetProgress = () => {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      if (!window.confirm("Reset all progress? Gems, completed challenges, and saved position will be wiped.")) return;
    }
    setGems(Object.fromEntries(GEMS.map((g) => [g.id, 0])));
    setCompleted([]);
    setStatusById({});
    setCurrentIdx(0);
    setActualByCurrent(null);
    setErrorByCurrent(null);
    setAnimationPhase("idle");
    setAnimationParsed(null);
    setPredictFeedback(null);
    setPipelineConfirmed({});
    setPredictBuilders(Object.fromEntries(CHALLENGES.map((c) => [c.id, { cols: [], rows: [] }])));
    setDiagnoseSelections(Object.fromEntries(CHALLENGES.filter((c) => c.type === "diagnose").map((c) => [c.id, null])));
    setQueries(Object.fromEntries(CHALLENGES.map((c) => [c.id, ""])));
    setPipelines(Object.fromEntries(CHALLENGES.map((c) => [c.id, []])));
  };

  const handleSubmit = () => {
    if (animating) return;
    if (editorLocked) return;
    if (!query.trim()) {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      setActualByCurrent(null);
      setErrorByCurrent("Editor is empty — write a query first.");
      setAnimationPhase("idle");
      setAnimationParsed(null);
      return;
    }
    try {
      const parsed = parseQuery(query);
      const actual = executeQuery(query, TABLES);
      if (compareResults(actual, expectedResult)) {
        setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
        setActualByCurrent(actual);
        setErrorByCurrent(null);
        setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
        earnGemsForChallenge(challenge);

        if (skipAnimations) {
          setAnimationParsed(null);
          setAnimationPhase("idle");
        } else {
          const first = computeFirstPhase(parsed, sourceColumns);
          if (first) {
            setAnimationParsed(parsed);
            setAnimationPhase(first); // AnimationStage takes over from here
          } else {
            setAnimationParsed(null);
            setAnimationPhase("idle");
          }
        }
      } else {
        setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
        setActualByCurrent(actual);
        setErrorByCurrent(null);
        setAnimationPhase("idle");
        setAnimationParsed(null);
      }
    } catch (e) {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      setActualByCurrent(null);
      setErrorByCurrent(e.message || String(e));
      setAnimationPhase("idle");
      setAnimationParsed(null);
    }
  };

  const goToChallenge = (idx) => {
    if (idx < 0 || idx >= CHALLENGES.length) return;
    setCurrentIdx(idx);
    setActualByCurrent(null);
    setErrorByCurrent(null);
    setAnimationPhase("idle");
    setAnimationParsed(null);
    setPredictFeedback(null);
  };

  // ---- PREDICT handlers ----
  const setBuilder = (next) => {
    setPredictBuilders((p) => ({ ...p, [challenge.id]: next }));
    setPredictFeedback(null);
    if (statusById[challenge.id] === "wrong") {
      setStatusById((s) => {
        const copy = { ...s };
        delete copy[challenge.id];
        return copy;
      });
    }
  };

  const togglePredictColumn = (col) => {
    const cur = builderState.cols;
    const idx = cur.indexOf(col);
    if (idx === -1) setBuilder({ ...builderState, cols: [...cur, col] });
    else            setBuilder({ ...builderState, cols: cur.filter((c) => c !== col) });
  };

  const clearPredictColumns = () => setBuilder({ ...builderState, cols: [] });

  const togglePredictSourceRow = (i) => {
    const cur = builderState.rows;
    const at = cur.indexOf(i);
    if (at === -1) setBuilder({ ...builderState, rows: [...cur, i] });
    else           setBuilder({ ...builderState, rows: cur.filter((x) => x !== i) });
  };

  const removePredictRow = (i) => {
    const cur = [...builderState.rows];
    cur.splice(i, 1);
    setBuilder({ ...builderState, rows: cur });
  };

  const movePredictRow = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= builderState.rows.length) return;
    const cur = [...builderState.rows];
    [cur[i], cur[j]] = [cur[j], cur[i]];
    setBuilder({ ...builderState, rows: cur });
  };

  const clearPredictRows = () => setBuilder({ ...builderState, rows: [] });

  const handleCheckPredict = () => {
    if (animating) return;
    let expected;
    let parsedTarget = null;
    try {
      expected = executeQuery(challenge.targetSql, TABLES);
      parsedTarget = parseQuery(challenge.targetSql);
    } catch {
      expected = { columns: [], rows: [] };
    }
    const orderMatters = !!(parsedTarget && parsedTarget.orderBy && parsedTarget.orderBy.length);
    const diag = diagnosePredict(builderState.cols, builderState.rows, sourceRows, expected, orderMatters);
    setPredictFeedback(diag);
    if (diag.ok) {
      setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
      setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
      earnGemsForChallenge(challenge);
      setActualByCurrent(null);
      setErrorByCurrent(null);
      if (skipAnimations) {
        setAnimationParsed(null);
        setAnimationPhase("idle");
      } else {
        try {
          const parsed = parseQuery(challenge.targetSql);
          const first = computeFirstPhase(parsed, sourceColumns);
          if (first) {
            setAnimationParsed(parsed);
            setAnimationPhase(first);
          } else {
            setAnimationParsed(null);
            setAnimationPhase("idle");
          }
        } catch {
          setAnimationParsed(null);
          setAnimationPhase("idle");
        }
      }
    } else {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
      setAnimationPhase("idle");
      setAnimationParsed(null);
    }
  };

  const handleNext = () => goToChallenge(currentIdx + 1);

  const hasNext = currentIdx < CHALLENGES.length - 1;

  const setPipelineForCurrent = (next) => {
    setPipelines((p) => ({ ...p, [challenge.id]: next }));
    // If the pipeline was confirmed and the user edits it, unconfirm so they re-lock-in.
    if (pipelineConfirmed[challenge.id]) {
      setPipelineConfirmed((c) => ({ ...c, [challenge.id]: false }));
    }
  };

  const confirmPipeline = () => {
    setPipelineConfirmed((c) => ({ ...c, [challenge.id]: true }));
    // Defer scroll so the editor mounts/unlocks first.
    setTimeout(() => {
      editorAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const editPipeline = () => {
    setPipelineConfirmed((c) => ({ ...c, [challenge.id]: false }));
  };

  // DIAGNOSE handlers
  const diagnoseSelected = isDiagnose ? diagnoseSelections[challenge.id] || null : null;
  const selectDiagnoseOption = (optId) => {
    setDiagnoseSelections((s) => ({ ...s, [challenge.id]: optId }));
    // Clear a prior wrong status so the user can re-pick without lingering shake.
    if (statusById[challenge.id] === "wrong") {
      setStatusById((s) => {
        const copy = { ...s };
        delete copy[challenge.id];
        return copy;
      });
    }
  };
  const handleDiagnoseSubmit = () => {
    if (!diagnoseSelected) return;
    if (diagnoseSelected === challenge.correctOption) {
      setStatusById((s) => ({ ...s, [challenge.id]: "correct" }));
      setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
      earnGemsForChallenge(challenge);
    } else {
      setStatusById((s) => ({ ...s, [challenge.id]: "wrong" }));
    }
  };

  // WRONG TOOL — find the first hint whose trigger matches the user's query.
  const matchingHint = useMemo(() => {
    if (!isWrongTool || status !== "wrong" || !challenge.hints) return null;
    return challenge.hints.find((h) => {
      try { return h.trigger(query); } catch { return false; }
    }) || null;
  }, [isWrongTool, status, challenge.hints, query]);

  const BADGES = {
    transform: { icon: "⚒️", label: "Forge the Query" },
    operation_builder: { icon: "🔧", label: "Build the Pipeline" },
    predict: { icon: "🔮", label: "Predict the Result" },
    wrong_tool: { icon: "⚡", label: "Find the Right Tool" },
    diagnose: { icon: "🩺", label: "Diagnose the Bug" },
  };
  const badge = BADGES[challenge.type] || BADGES.transform;

  return (
    <div
      className="min-h-screen text-stone-100"
      style={{
        fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(120, 53, 15, 0.15), transparent 60%), radial-gradient(900px 500px at 110% 20%, rgba(8, 47, 73, 0.18), transparent 60%), linear-gradient(180deg, #0c0a09 0%, #1c1917 100%)",
      }}
    >
      <style>{`
        @keyframes sfShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .sf-shake { animation: sfShake 320ms ease-in-out; }
        @keyframes sfGemPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        .sf-gem-pulse { animation: sfGemPulse 2s ease-in-out infinite; transform-origin: center; }
        @keyframes sfGemPop {
          0%   { transform: scale(1); filter: brightness(1); }
          50%  { transform: scale(1.3); filter: brightness(1.6); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .sf-gem-pop { animation: sfGemPop 400ms ease-out; transform-origin: center; }
        textarea::placeholder { color: #57534e; -webkit-text-fill-color: #57534e; }
      `}</style>

      <GemBelt gems={gems} recentLevelUp={recentLevelUp} />

      <div className="flex" style={{ minHeight: "calc(100vh - 49px)" }}>
        <LayerMap
          layers={LAYERS}
          challenges={CHALLENGES}
          currentChallengeIdx={currentIdx}
          completedIds={completed}
          onSelectChallenge={goToChallenge}
          onResetProgress={handleResetProgress}
        />

        <main className="flex-1 p-6 overflow-x-hidden">
          {/* Challenge header */}
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-500 mb-1">
                Challenge {currentIdx + 1} of {CHALLENGES.length} — Layer 1: The Surface
              </div>
              <h1 className="text-2xl font-bold text-stone-100">
                <span className="text-stone-500 font-mono mr-2">{challenge.id}</span>
                {challenge.title}
              </h1>
              <p className="text-sm text-stone-400 mt-1 max-w-2xl">{challenge.description}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-200 shrink-0">
              {badge.icon} {badge.label}
            </div>
          </div>

          {/* DIAGNOSE — completely different UI: broken query + wrong/expected + radio options */}
          {isDiagnose && (
            <DiagnoseChallenge
              challenge={challenge}
              sourceColumns={sourceColumns}
              sourceRows={sourceRows}
              selectedId={diagnoseSelected}
              onSelect={selectDiagnoseOption}
              onDiagnose={handleDiagnoseSubmit}
              status={status}
            />
          )}

          {/* Predict — query card sits above source + builder */}
          {isPredict && <PredictQueryCard sql={challenge.displaySql} />}

          {/* Source + Target/Builder side by side — skip for DIAGNOSE (has its own layout) */}
          {!isDiagnose && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <DataTable
              title="shows"
              columns={sourceColumns}
              rows={sourceRows}
              variant="source"
              selectedRowIndices={isPredict ? builderState.rows : null}
              onRowClick={
                isPredict && !animating && status !== "correct"
                  ? togglePredictSourceRow
                  : null
              }
            />
            {isPredict ? (
              <ResultBuilder
                sourceColumns={sourceColumns}
                sourceRows={sourceRows}
                builderCols={builderState.cols}
                builderRowIdx={builderState.rows}
                onToggleColumn={togglePredictColumn}
                onClearColumns={clearPredictColumns}
                onRemoveRow={removePredictRow}
                onMoveRow={movePredictRow}
                onClearRows={clearPredictRows}
                onCheck={handleCheckPredict}
                status={status}
                feedback={predictFeedback}
                disabled={animating || status === "correct"}
              />
            ) : (
              <DataTable title="expected result" columns={expectedResult.columns} rows={expectedResult.rows} variant="target" />
            )}
          </div>
          )}

          {/* Operation Builder — only for operation_builder challenges */}
          {isOpBuilder && !isPipelineConfirmed && (
            <div className="mb-4 space-y-3">
              <OperationsPalette />
              <PipelineBuilder
                pipeline={pipeline}
                onChange={setPipelineForCurrent}
                validation={pipelineValidation}
                expectedPipeline={challenge.expectedPipeline}
                onConfirm={confirmPipeline}
                canConfirm={canConfirmPipeline}
              />
            </div>
          )}

          {/* Compact pipeline reference once confirmed */}
          {isOpBuilder && isPipelineConfirmed && (
            <div className="mb-3">
              <PipelineReference pipeline={pipelineFilled} onEdit={editPipeline} />
            </div>
          )}

          {/* Editor — hidden in predict and diagnose modes (those have their own answer surfaces) */}
          {!isPredict && !isDiagnose && (
            <div className="mb-4 space-y-2" ref={editorAnchorRef}>
              {editorLocked ? (
                <div className="rounded-lg border border-dashed border-stone-800 bg-stone-950/40 p-6 text-center text-xs text-stone-500 italic">
                  Build the pipeline above first, then the SQL editor unlocks.
                </div>
              ) : (
                <>
                  <SqlEditor
                    value={query}
                    onChange={(v) => setQueries((q) => ({ ...q, [challenge.id]: v }))}
                    onSubmit={handleSubmit}
                    status={status}
                    errorMessage={errorByCurrent}
                    submitDisabled={animating}
                  />
                  <SyntaxShelf gems={gems} />
                </>
              )}
            </div>
          )}

          {/* Skip-animations toggle — hidden for diagnose (no animation flow) */}
          {!isDiagnose && (
            <div className="mb-3 flex justify-end">
              <label className="inline-flex items-center gap-2 text-[11px] text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipAnimations}
                  onChange={(e) => setSkipAnimations(e.target.checked)}
                  className="accent-amber-500"
                />
                Skip animations
              </label>
            </div>
          )}

          {/* Animation stage — visible only when we kicked one off for this submission */}
          {status === "correct" && animationParsed && animationPhase !== "idle" && (
            <div className="mb-4">
              <AnimationStage
                parsed={animationParsed}
                sourceColumns={sourceColumns}
                sourceRows={sourceRows}
                onPhaseChange={setAnimationPhase}
              />
            </div>
          )}

          {/* Wrong-tool hint — shown after a wrong submission when a trigger matches */}
          {isWrongTool && status === "wrong" && matchingHint && (
            <WrongToolHint message={matchingHint.message} />
          )}

          {/* Feedback */}
          {status === "correct" && !animating && (
            <WhyPanel
              why={isDiagnose ? challenge.explanation : challenge.why}
              onNext={handleNext}
              hasNext={hasNext}
            />
          )}
          {status === "wrong" && !isPredict && !isDiagnose && (
            <ResultComparison actual={actualByCurrent} expected={expectedResult} errorMessage={errorByCurrent} />
          )}
        </main>
      </div>
    </div>
  );
}
