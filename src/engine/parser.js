import { tokenize } from './tokenizer';

export const AGG_FUNCS = new Set(["count", "sum", "avg", "min", "max"]);

// Identifiers that are reserved keywords for clause boundaries — they CANNOT
// be table aliases right after FROM / JOIN. Without this guard, `FROM shows
// WHERE ...` would treat `where` as a table alias.
export const RESERVED_AFTER_FROM = new Set([
  "where", "group", "having", "order", "limit",
  "inner", "left", "right", "full", "outer", "join", "on", "as",
]);

export function exprHasAgg(expr) {
  if (!expr) return false;
  if (expr.type === "agg") return true;
  if (expr.type === "func") return expr.args.some(exprHasAgg);
  if (expr.type === "case") {
    return expr.branches.some((b) => exprHasAgg(b.then)) || (expr.else && exprHasAgg(expr.else));
  }
  return false;
}

export function exprDefaultName(expr) {
  if (expr.type === "col") return expr.name;
  if (expr.type === "agg") {
    const argName = expr.arg.type === "star" ? "*" : expr.arg.name;
    return `${expr.func}(${argName})`;
  }
  if (expr.type === "func") return `${expr.name}(...)`;
  if (expr.type === "case") return "case";
  if (expr.type === "literal") return String(expr.value);
  return "expr";
}

export function collectWhereColumns(expr) {
  const cols = new Set();
  function walk(e) {
    if (!e) return;
    switch (e.type) {
      case "and":
      case "or":
        walk(e.left); walk(e.right); break;
      case "not":
        walk(e.expr); break;
      case "compare":
      case "is_null":
      case "like":
      case "in":
      case "not_in":
      case "between":
        cols.add(e.column); break;
    }
  }
  walk(expr);
  return cols;
}

export function exprValidInAggregateSelect(expr, groupSet) {
  if (!expr) return true;
  if (expr.type === "agg") return true;
  if (expr.type === "literal") return true;
  if (expr.type === "col") return groupSet.has(expr.name);
  if (expr.type === "func") return expr.args.every((a) => exprValidInAggregateSelect(a, groupSet));
  if (expr.type === "case") {
    return expr.branches.every((b) => exprValidInAggregateSelect(b.then, groupSet))
      && (!expr.else || exprValidInAggregateSelect(expr.else, groupSet));
  }
  return false;
}

export function parseQuery(sql) {
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

  // ----- column reference: ident or ident.ident (qualified) -----
  // Returns { qualifier, name }. Qualifier is null for bare refs like `name`,
  // and the table alias for refs like `s.name`. The bind step in executeQuery
  // resolves these to actual row keys at execution time.
  function parseColumnRef() {
    const t = consume();
    if (!t || t.type !== "ident") {
      throw new Error(`Expected column name, got ${t ? (t.raw || t.value || t.type) : "end of input"}`);
    }
    if (peek() && peek().type === "dot") {
      consume(); // dot
      const t2 = consume();
      if (!t2 || t2.type !== "ident") throw new Error("Expected column name after .");
      return { qualifier: t.value, name: t2.value };
    }
    return { qualifier: null, name: t.value };
  }

  // ----- expressions that yield a value (column refs, literals, function calls, CASE) -----
  function parseValueExpr() {
    const t = peek();
    if (!t) throw new Error("Expected expression");

    if (t.type === "number" || t.type === "string") {
      consume();
      return { type: "literal", value: t.value };
    }

    if (t.type === "ident") {
      // CASE WHEN ... [WHEN ...]* [ELSE ...] END
      if (t.value === "case") {
        consume();
        const branches = [];
        while (isKw("when")) {
          consume();
          const cond = parseOr();
          if (!isKw("then")) throw new Error("Expected THEN after WHEN");
          consume();
          const thenVal = parseValueExpr();
          branches.push({ when: cond, then: thenVal });
        }
        if (branches.length === 0) throw new Error("CASE requires at least one WHEN clause");
        let elseExpr = null;
        if (isKw("else")) {
          consume();
          elseExpr = parseValueExpr();
        }
        if (!isKw("end")) throw new Error("Expected END to close CASE");
        consume();
        return { type: "case", branches, else: elseExpr };
      }

      // Function call vs plain column ref
      const next = peek(1);
      if (next && next.type === "lparen") {
        const fname = t.value;
        consume(); // ident
        consume(); // lparen

        if (AGG_FUNCS.has(fname)) {
          let arg;
          const argT = peek();
          if (argT && argT.type === "star") {
            consume();
            arg = { type: "star" };
          } else if (argT && argT.type === "ident" && argT.value === "case") {
            // SUM/AVG/MIN/MAX/COUNT can wrap a CASE expression that's
            // evaluated per row, then aggregated across the group.
            arg = parseValueExpr();
          } else if (argT && argT.type === "ident") {
            // COUNT(DISTINCT <col>) — DISTINCT keyword is only valid inside COUNT
            let isDistinct = false;
            if (fname === "count" && argT.value === "distinct") {
              consume(); // distinct
              isDistinct = true;
            }
            const ref = parseColumnRef();
            arg = { type: "col", name: ref.name, qualifier: ref.qualifier, distinct: isDistinct };
          } else {
            throw new Error(`Expected column, *, or CASE in ${fname.toUpperCase()}(...)`);
          }
          if (!peek() || peek().type !== "rparen") throw new Error(`Expected ) after ${fname.toUpperCase()}(...)`);
          consume();
          return { type: "agg", func: fname, arg };
        }

        if (fname === "round") {
          const inner = parseValueExpr();
          if (!peek() || peek().type !== "comma") throw new Error("ROUND expects (value, decimals)");
          consume();
          const decT = peek();
          if (!decT || decT.type !== "number") throw new Error("ROUND decimals must be a number");
          consume();
          if (!peek() || peek().type !== "rparen") throw new Error("Expected ) after ROUND(...)");
          consume();
          return { type: "func", name: "round", args: [inner, { type: "literal", value: decT.value }] };
        }

        throw new Error(`Unknown function: ${t.raw || t.value}`);
      }

      // Plain column ref (parseColumnRef handles dotted refs like s.name)
      const ref = parseColumnRef();
      return { type: "col", name: ref.name, qualifier: ref.qualifier };
    }

    throw new Error(`Unexpected token in expression: ${t.raw || t.value || t.type}`);
  }

  expectKeyword("select");

  let distinct = false;
  if (isKw("distinct")) { consume(); distinct = true; }

  const selectItems = [];
  let isStar = false;
  if (peek() && peek().type === "star") {
    consume();
    isStar = true;
  } else {
    while (true) {
      const expr = parseValueExpr();
      let alias = null;
      if (isKw("as")) {
        consume();
        const aliasTok = peek();
        if (!aliasTok || aliasTok.type !== "ident") throw new Error("Expected alias after AS");
        consume();
        alias = aliasTok.value;
      }
      selectItems.push({ expr, alias, outName: alias || exprDefaultName(expr) });
      if (peek() && peek().type === "comma") { consume(); continue; }
      break;
    }
  }

  expectKeyword("from");
  const tableTok = peek();
  if (!tableTok || tableTok.type !== "ident") throw new Error("Expected table name");
  const table = consume().value;

  // Optional table alias: `FROM shows s`. If the next token is a keyword
  // (WHERE, JOIN, GROUP, etc.) the alias defaults to the table name itself
  // so that `FROM shows` and `FROM shows shows` resolve refs the same way.
  let fromAlias = table;
  if (peek() && peek().type === "ident" && !RESERVED_AFTER_FROM.has(peek().value)) {
    fromAlias = consume().value;
  }

  // Zero or more JOIN clauses. Layer 3 supports [INNER] JOIN and LEFT [OUTER] JOIN.
  const joins = [];
  while (true) {
    let joinType = null;
    if (isKw("inner") && isKw("join", 1)) {
      consume(); consume();
      joinType = "inner";
    } else if (isKw("left")) {
      consume();
      if (isKw("outer")) consume();
      if (!isKw("join")) throw new Error("Expected JOIN after LEFT");
      consume();
      joinType = "left";
    } else if (isKw("join")) {
      consume();
      joinType = "inner";
    } else {
      break;
    }
    const jTableTok = peek();
    if (!jTableTok || jTableTok.type !== "ident") throw new Error("Expected table name after JOIN");
    const joinTable = consume().value;
    let joinAlias = joinTable;
    // Alias only if the next ident isn't ON / a clause keyword
    if (peek() && peek().type === "ident" && !RESERVED_AFTER_FROM.has(peek().value) && peek().value !== "on") {
      joinAlias = consume().value;
    }
    if (!isKw("on")) throw new Error("Expected ON after JOIN <table>");
    consume();
    const leftRef = parseColumnRef();
    if (!peek() || peek().type !== "op" || peek().value !== "=") {
      throw new Error("JOIN ON expects an equality condition (left.col = right.col)");
    }
    consume();
    const rightRef = parseColumnRef();
    joins.push({ type: joinType, table: joinTable, alias: joinAlias, leftRef, rightRef });
  }

  let where = null;
  if (isKw("where")) {
    consume();
    where = parseOr();
  }

  let groupBy = null;
  if (isKw("group")) {
    consume();
    if (!isKw("by")) throw new Error("Expected BY after GROUP");
    consume();
    groupBy = [];
    while (true) {
      const ref = parseColumnRef();
      groupBy.push({ name: ref.name, qualifier: ref.qualifier });
      if (peek() && peek().type === "comma") { consume(); continue; }
      break;
    }
  }

  let having = null;
  if (isKw("having")) {
    consume();
    having = parseHavingOr();
  }

  let orderBy = null;
  if (isKw("order")) {
    consume();
    if (!isKw("by")) throw new Error("Expected BY after ORDER");
    consume();
    orderBy = [];
    while (true) {
      // ORDER BY references the OUTPUT column. Qualifier (if any) is silently
      // dropped — `ORDER BY s.name` and `ORDER BY name` both refer to the
      // `name` column in the result, since SELECT items output bare names.
      const ref = parseColumnRef();
      let direction = "asc";
      if (isKw("asc")) { consume(); }
      else if (isKw("desc")) { consume(); direction = "desc"; }
      orderBy.push({ column: ref.name, direction });
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

  // ----- WHERE boolean expression -----
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
    const ref = parseColumnRef();
    const col = ref.name;
    const qualifier = ref.qualifier;
    const next = peek();
    if (!next) throw new Error(`Expected condition after ${col}`);

    if (next.type === "ident" && next.value === "is") {
      consume();
      let negate = false;
      if (peek() && peek().type === "ident" && peek().value === "not") { consume(); negate = true; }
      if (!peek() || peek().type !== "ident" || peek().value !== "null") throw new Error("Expected NULL");
      consume();
      return { type: "is_null", column: col, qualifier, negate };
    }
    if (next.type === "ident" && next.value === "like") {
      consume();
      const pat = consume();
      if (!pat || pat.type !== "string") throw new Error("LIKE expects a string pattern");
      return { type: "like", column: col, qualifier, pattern: pat.value };
    }
    if (next.type === "ident" && next.value === "between") {
      consume();
      const low = consume();
      if (!low || (low.type !== "number" && low.type !== "string")) throw new Error("BETWEEN expects a value");
      if (!peek() || peek().type !== "ident" || peek().value !== "and") throw new Error("Expected AND in BETWEEN");
      consume();
      const high = consume();
      if (!high || (high.type !== "number" && high.type !== "string")) throw new Error("BETWEEN expects a value");
      return { type: "between", column: col, qualifier, low: low.value, high: high.value };
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
      return { type: negate ? "not_in" : "in", column: col, qualifier, values };
    }
    if (next.type === "op") {
      consume();
      const right = consume();
      if (!right) throw new Error("Expected literal on right side of comparison");
      if (right.type === "ident" && right.value === "null") {
        return { type: "compare", column: col, qualifier, op: next.value, value: null };
      }
      if (right.type !== "number" && right.type !== "string") throw new Error("Expected literal on right side of comparison");
      return { type: "compare", column: col, qualifier, op: next.value, value: right.value };
    }
    throw new Error(`Unexpected token in condition: ${next.raw || next.value || next.type}`);
  }

  // ----- HAVING boolean expression: left side must be an aggregate value expr -----
  function parseHavingOr() {
    let left = parseHavingAnd();
    while (isKw("or")) { consume(); const right = parseHavingAnd(); left = { type: "or", left, right }; }
    return left;
  }
  function parseHavingAnd() {
    let left = parseHavingNot();
    while (isKw("and")) { consume(); const right = parseHavingNot(); left = { type: "and", left, right }; }
    return left;
  }
  function parseHavingNot() {
    if (isKw("not")) { consume(); return { type: "not", expr: parseHavingCondition() }; }
    return parseHavingCondition();
  }
  function parseHavingCondition() {
    if (peek() && peek().type === "lparen") {
      consume();
      const expr = parseHavingOr();
      if (!peek() || peek().type !== "rparen") throw new Error("Expected )");
      consume();
      return expr;
    }
    const left = parseValueExpr();
    if (!exprHasAgg(left)) {
      throw new Error("HAVING requires an aggregate expression (COUNT, SUM, AVG, MIN, MAX, or ROUND(...))");
    }
    const opTok = peek();
    if (!opTok || opTok.type !== "op") throw new Error("Expected comparison operator in HAVING");
    consume();
    const right = peek();
    if (!right || (right.type !== "number" && right.type !== "string")) {
      throw new Error("HAVING expects a literal on the right side");
    }
    consume();
    return { type: "compare_expr", left, op: opTok.value, value: right.value };
  }

  // ----- back-compat: when the query is fully simple (column refs only), produce
  //       the legacy `columns` / `aliases` shape so the existing animation path
  //       and tests keep working unchanged. Aggregate / starless paths use selectItems.
  const isAggregate = (groupBy && groupBy.length > 0) || selectItems.some((it) => exprHasAgg(it.expr));

  let legacyColumns;
  const legacyAliases = {};
  if (isStar) {
    legacyColumns = ["*"];
  } else if (!isAggregate && selectItems.every((it) => it.expr.type === "col")) {
    legacyColumns = selectItems.map((it) => it.expr.name);
    for (const it of selectItems) if (it.alias) legacyAliases[it.expr.name] = it.alias;
  } else {
    legacyColumns = selectItems.map((it) => it.outName);
  }

  return {
    columns: legacyColumns,
    aliases: legacyAliases,
    selectItems,
    isStar,
    isAggregate,
    table,
    fromAlias,
    joins,
    where,
    groupBy,
    having,
    orderBy,
    limit,
    distinct,
  };
}
