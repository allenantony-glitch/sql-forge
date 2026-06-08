import { parseQuery, exprDefaultName, exprValidInAggregateSelect } from './parser';
import { TABLE_COLUMN_ORDER } from '../data/shows';
import { rowKey } from './comparator';

// Outer-row keys are prefixed so they cannot collide with inner-row keys when
// a correlated subquery merges them into one lookup row.
const OUTER_PREFIX = "__outer__:";

export function sortRowsBy(rows, orderBy) {
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

function compareScalar(v, op, value) {
  if (v == null || value == null) return false;
  switch (op) {
    case "=":  return v === value;
    case "!=": return v !== value;
    case ">":  return v >  value;
    case "<":  return v <  value;
    case ">=": return v >= value;
    case "<=": return v <= value;
    default: return false;
  }
}

export function evalExpr(expr, row, ctx = null) {
  switch (expr.type) {
    case "and": return evalExpr(expr.left, row, ctx) && evalExpr(expr.right, row, ctx);
    case "or":  return evalExpr(expr.left, row, ctx) || evalExpr(expr.right, row, ctx);
    case "not": return !evalExpr(expr.expr, row, ctx);
    case "compare": {
      const v = row[expr.column];
      if (v == null) return false; // NULL fails every comparison
      if (expr.value == null) return false;
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
    case "compare_cols": {
      const lv = row[expr.left.name];
      const rv = row[expr.right.name];
      return compareScalar(lv, expr.op, rv);
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
    case "exists": {
      if (!ctx) throw new Error("EXISTS used outside of execution context");
      const sub = executeBoundQuery(expr.subquery, ctx.tables, row);
      return sub.rows.length > 0;
    }
    case "in_subquery": {
      if (!ctx) throw new Error("IN (SELECT...) used outside of execution context");
      const sub = executeBoundQuery(expr.subquery, ctx.tables, row);
      const lhs = row[expr.column];
      if (lhs == null) return false;
      const col = sub.columns[0];
      for (const r of sub.rows) if (r[col] === lhs) return true;
      return false;
    }
    case "not_in_subquery": {
      if (!ctx) throw new Error("NOT IN (SELECT...) used outside of execution context");
      const sub = executeBoundQuery(expr.subquery, ctx.tables, row);
      const lhs = row[expr.column];
      if (lhs == null) return false;
      // SQL semantics: NOT IN against a list containing NULL yields unknown (false).
      const col = sub.columns[0];
      for (const r of sub.rows) {
        if (r[col] == null) return false;
        if (r[col] === lhs) return false;
      }
      return true;
    }
    case "compare_subquery": {
      if (!ctx) throw new Error("Subquery used outside of execution context");
      const sub = executeBoundQuery(expr.subquery, ctx.tables, row);
      if (sub.rows.length === 0) return false;
      if (sub.rows.length !== 1 || sub.columns.length !== 1) {
        throw new Error("Scalar subquery must return exactly one value");
      }
      const subVal = sub.rows[0][sub.columns[0]];
      const v = row[expr.column];
      return compareScalar(v, expr.op, subVal);
    }
    default: return false;
  }
}

// Evaluate a value-yielding expression against a single row.
export function evalValueExpr(expr, row, ctx = null) {
  switch (expr.type) {
    case "literal": return expr.value;
    case "col":     return row[expr.name];
    case "func":
      if (expr.name === "round") {
        const v = evalValueExpr(expr.args[0], row, ctx);
        const d = evalValueExpr(expr.args[1], row, ctx);
        if (v == null) return null;
        return Number(Number(v).toFixed(d));
      }
      throw new Error(`Unknown function: ${expr.name}`);
    case "case":
      for (const b of expr.branches) {
        if (evalExpr(b.when, row, ctx)) return evalValueExpr(b.then, row, ctx);
      }
      return expr.else ? evalValueExpr(expr.else, row, ctx) : null;
    case "select_subquery": {
      if (!ctx) throw new Error("Subquery used outside of execution context");
      const sub = executeBoundQuery(expr.subquery, ctx.tables, row);
      if (sub.rows.length === 0) return null;
      if (sub.rows.length !== 1 || sub.columns.length !== 1) {
        throw new Error("Scalar subquery in SELECT must return exactly one value");
      }
      return sub.rows[0][sub.columns[0]];
    }
    default:
      throw new Error(`Cannot evaluate expression of type ${expr.type}`);
  }
}

// Evaluate an expression (possibly containing aggregates) over a group of rows.
export function evalAggOnGroup(expr, groupRows, ctx = null) {
  switch (expr.type) {
    case "literal": return expr.value;
    case "col":
      // Bare column ref in an aggregate SELECT must be a GROUP BY key —
      // every row in the group has the same value, so read from the first.
      return groupRows.length > 0 ? groupRows[0][expr.name] : null;
    case "agg": {
      const f = expr.func;
      if (f === "count") {
        if (expr.arg.type === "star") return groupRows.length;
        if (expr.arg.distinct) {
          const seen = new Set();
          for (const r of groupRows) {
            const v = r[expr.arg.name];
            if (v != null) seen.add(v);
          }
          return seen.size;
        }
        return groupRows.filter((r) => r[expr.arg.name] != null).length;
      }
      const vals = expr.arg.type === "col"
        ? groupRows.map((r) => r[expr.arg.name]).filter((v) => v != null)
        : groupRows.map((r) => evalValueExpr(expr.arg, r, ctx)).filter((v) => v != null);
      if (vals.length === 0) return null;
      if (f === "sum") return vals.reduce((a, b) => a + b, 0);
      if (f === "avg") return vals.reduce((a, b) => a + b, 0) / vals.length;
      if (f === "min") return vals.reduce((a, b) => (b < a ? b : a));
      if (f === "max") return vals.reduce((a, b) => (b > a ? b : a));
      throw new Error(`Unknown aggregate: ${f}`);
    }
    case "func":
      if (expr.name === "round") {
        const v = evalAggOnGroup(expr.args[0], groupRows, ctx);
        const d = evalAggOnGroup(expr.args[1], groupRows, ctx);
        if (v == null) return null;
        return Number(Number(v).toFixed(d));
      }
      throw new Error(`Unknown function: ${expr.name}`);
    case "case":
      for (const b of expr.branches) {
        if (groupRows.length > 0 && evalExpr(b.when, groupRows[0], ctx)) {
          return evalAggOnGroup(b.then, groupRows, ctx);
        }
      }
      return expr.else ? evalAggOnGroup(expr.else, groupRows, ctx) : null;
    case "select_subquery":
      return evalValueExpr(expr, groupRows.length > 0 ? groupRows[0] : {}, ctx);
    default:
      throw new Error(`Cannot evaluate aggregate expression of type ${expr.type}`);
  }
}

export function evalHaving(expr, groupRows, ctx = null) {
  switch (expr.type) {
    case "and": return evalHaving(expr.left, groupRows, ctx) && evalHaving(expr.right, groupRows, ctx);
    case "or":  return evalHaving(expr.left, groupRows, ctx) || evalHaving(expr.right, groupRows, ctx);
    case "not": return !evalHaving(expr.expr, groupRows, ctx);
    case "compare_expr": {
      const v = evalAggOnGroup(expr.left, groupRows, ctx);
      if (v == null) return false;
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
    default: return false;
  }
}

// ----- scope construction + recursive binding -----

function tableColumnsFor(parsed, tables, alias) {
  if (alias === parsed.fromAlias && parsed.derivedTable) {
    return parsed.derivedTable.selectItems.map((it) => it.outName);
  }
  const tname = alias === parsed.fromAlias
    ? parsed.table
    : (parsed.joins.find((j) => j.alias === alias) || {}).table;
  if (!tname) return [];
  return TABLE_COLUMN_ORDER[tname]
    || (tables[tname] && tables[tname][0] ? Object.keys(tables[tname][0]) : []);
}

function buildScope(parsed, tables, outerScope) {
  const aliases = [parsed.fromAlias, ...(parsed.joins || []).map((j) => j.alias)];
  const columnsByAlias = {};
  for (const a of aliases) columnsByAlias[a] = tableColumnsFor(parsed, tables, a);
  const isJoined = (parsed.joins || []).length > 0;
  return { aliases, columnsByAlias, isJoined, outerScope };
}

// Try to bind (qualifier, name) within `scope`. Returns the bound key without
// any outer prefix, or null if not present at this scope level.
function bindRefInScope(scope, qualifier, name) {
  if (qualifier) {
    if (!scope.aliases.includes(qualifier)) return null;
    if (!scope.columnsByAlias[qualifier].includes(name)) return null;
    return scope.isJoined ? `${qualifier}.${name}` : name;
  }
  const matches = scope.aliases.filter((a) => scope.columnsByAlias[a].includes(name));
  if (matches.length === 1) return scope.isJoined ? `${matches[0]}.${name}` : name;
  if (matches.length > 1) {
    throw new Error(`Ambiguous column reference "${name}" — qualify with an alias (e.g. ${matches[0]}.${name})`);
  }
  return null;
}

// Walk the outer-scope chain. Each level we descend adds one OUTER_PREFIX so the
// executor's lookup matches the prefixed-outer-row keys.
function bindOuter(scope, qualifier, name) {
  if (!scope) return null;
  const here = bindRefInScope(scope, qualifier, name);
  if (here != null) return here;
  const deeper = bindOuter(scope.outerScope, qualifier, name);
  if (deeper != null) return OUTER_PREFIX + deeper;
  return null;
}

// Exported so animation consumers can bind a separately-parsed AST before
// handing it to evalExpr — without binding, correlated subqueries that
// reference outer aliases (e.g. `r.show_id = s.id`) get mis-evaluated.
export function bindParsed(parsed, tables, outerScope = null) {
  // Set operations (UNION / INTERSECT / EXCEPT) are non-correlated: bind each
  // branch independently, then we're done — there's no outer scope to expose.
  if (parsed.type === "set_operation") {
    bindParsed(parsed.left, tables, null);
    bindParsed(parsed.right, tables, null);
    return null;
  }

  // Derived table in FROM is non-correlated by SQL semantics — bind it
  // independently with no outer scope.
  if (parsed.derivedTable) {
    bindParsed(parsed.derivedTable, tables, null);
  }

  const scope = buildScope(parsed, tables, outerScope);

  function bindCol(qualifier, name) {
    const inner = bindRefInScope(scope, qualifier, name);
    if (inner != null) return inner;
    const outer = bindOuter(outerScope, qualifier, name);
    if (outer != null) return OUTER_PREFIX + outer;
    if (qualifier) {
      if (![...(scope.aliases || []), ...collectOuterAliases(outerScope)].includes(qualifier)) {
        throw new Error(`Unknown table alias: ${qualifier}`);
      }
      throw new Error(`Unknown column: ${qualifier}.${name}`);
    }
    throw new Error(`Unknown column: ${name}`);
  }

  function walkWhere(e) {
    if (!e) return;
    switch (e.type) {
      case "and": case "or": walkWhere(e.left); walkWhere(e.right); return;
      case "not": walkWhere(e.expr); return;
      case "compare": case "is_null": case "like": case "between":
      case "in": case "not_in":
        e.column = bindCol(e.qualifier, e.column);
        e.qualifier = null;
        return;
      case "compare_cols":
        e.left.name = bindCol(e.left.qualifier, e.left.name);
        e.left.qualifier = null;
        e.right.name = bindCol(e.right.qualifier, e.right.name);
        e.right.qualifier = null;
        return;
      case "in_subquery": case "not_in_subquery": case "compare_subquery":
        e.column = bindCol(e.qualifier, e.column);
        e.qualifier = null;
        bindParsed(e.subquery, tables, scope);
        return;
      case "exists":
        bindParsed(e.subquery, tables, scope);
        return;
      case "compare_expr": walkValue(e.left); return;
    }
  }

  function walkValue(e) {
    if (!e) return;
    switch (e.type) {
      case "literal": return;
      case "col":
        e.name = bindCol(e.qualifier, e.name);
        e.qualifier = null;
        return;
      case "agg":
        if (e.arg) {
          if (e.arg.type === "col") {
            e.arg.name = bindCol(e.arg.qualifier, e.arg.name);
            e.arg.qualifier = null;
          } else if (e.arg.type !== "star") {
            walkValue(e.arg);
          }
        }
        return;
      case "func":
        e.args.forEach(walkValue);
        return;
      case "case":
        e.branches.forEach((b) => { walkWhere(b.when); walkValue(b.then); });
        if (e.else) walkValue(e.else);
        return;
      case "select_subquery":
        bindParsed(e.subquery, tables, scope);
        return;
    }
  }

  if (parsed.where) walkWhere(parsed.where);
  if (parsed.having) walkWhere(parsed.having);
  for (const it of (parsed.selectItems || [])) walkValue(it.expr);
  if (parsed.groupBy) {
    parsed.groupBy = parsed.groupBy.map((g) => bindCol(g.qualifier, g.name));
  }
  for (const j of (parsed.joins || [])) {
    j.leftRef.bound  = bindCol(j.leftRef.qualifier,  j.leftRef.name);
    j.rightRef.bound = bindCol(j.rightRef.qualifier, j.rightRef.name);
  }

  return scope;
}

function collectOuterAliases(scope) {
  const out = [];
  let s = scope;
  while (s) {
    for (const a of s.aliases) out.push(a);
    s = s.outerScope;
  }
  return out;
}

// ----- joined row construction -----

export function buildJoinedRows(parsed, tables, sourceOverride = null) {
  const prefix = (row, alias) => {
    const out = {};
    for (const k of Object.keys(row)) out[`${alias}.${k}`] = row[k];
    return out;
  };
  const baseRows = sourceOverride != null ? sourceOverride : (tables[parsed.table] || []);
  let rows = baseRows.map((r) => prefix(r, parsed.fromAlias));
  for (const j of parsed.joins) {
    const rightRows = (tables[j.table] || []).map((r) => prefix(r, j.alias));
    const rightCols = TABLE_COLUMN_ORDER[j.table] || (tables[j.table][0] ? Object.keys(tables[j.table][0]) : []);
    const nullRight = {};
    for (const c of rightCols) nullRight[`${j.alias}.${c}`] = null;

    const next = [];
    for (const lrow of rows) {
      const lkey = lrow[j.leftRef.bound];
      let matched = false;
      if (lkey != null) {
        for (const rrow of rightRows) {
          if (rrow[j.rightRef.bound] === lkey) {
            next.push({ ...lrow, ...rrow });
            matched = true;
          }
        }
      }
      if (!matched && j.type === "left") {
        next.push({ ...lrow, ...nullRight });
      }
    }
    rows = next;
  }
  return rows;
}

function prefixOuterRow(row) {
  const out = {};
  for (const k of Object.keys(row)) out[OUTER_PREFIX + k] = row[k];
  return out;
}

// UNION / INTERSECT / EXCEPT — combine two query results.
// Left side's column names become the output's column names (SQL convention).
function executeSetOperation(parsed, tables, outerRow) {
  const leftResult = executeBoundQuery(parsed.left, tables, outerRow);
  const rightResult = executeBoundQuery(parsed.right, tables, outerRow);
  if (leftResult.columns.length !== rightResult.columns.length) {
    throw new Error("UNION/INTERSECT/EXCEPT require the same number of columns");
  }
  const columns = leftResult.columns;
  const keyOf = (row, cols) => cols.map((c) => (row[c] == null ? " NULL" : String(row[c]))).join("|");

  // The right-side rows are accessed by the LEFT side's column names, since
  // SQL set operations match positionally. Re-key right rows accordingly.
  const rightAligned = rightResult.rows.map((r) => {
    const o = {};
    rightResult.columns.forEach((c, i) => { o[columns[i]] = r[c]; });
    return o;
  });

  if (parsed.op === "union") {
    if (parsed.all) return { columns, rows: [...leftResult.rows, ...rightAligned] };
    const seen = new Set();
    const rows = [];
    for (const row of [...leftResult.rows, ...rightAligned]) {
      const key = keyOf(row, columns);
      if (!seen.has(key)) { seen.add(key); rows.push(row); }
    }
    return { columns, rows };
  }

  if (parsed.op === "intersect") {
    const rightKeys = new Set(rightAligned.map((r) => keyOf(r, columns)));
    const seen = new Set();
    const rows = [];
    for (const row of leftResult.rows) {
      const key = keyOf(row, columns);
      if (rightKeys.has(key) && !seen.has(key)) { seen.add(key); rows.push(row); }
    }
    return { columns, rows };
  }

  if (parsed.op === "except") {
    const rightKeys = new Set(rightAligned.map((r) => keyOf(r, columns)));
    const seen = new Set();
    const rows = [];
    for (const row of leftResult.rows) {
      const key = keyOf(row, columns);
      if (!rightKeys.has(key) && !seen.has(key)) { seen.add(key); rows.push(row); }
    }
    return { columns, rows };
  }

  throw new Error(`Unknown set operation: ${parsed.op}`);
}

// Execute an already-bound parsed query. For correlated subqueries, the caller
// passes the current outer row; its keys get an OUTER_PREFIX so they coexist
// with the inner row's keys when both are merged for evaluation.
function executeBoundQuery(parsed, tables, outerRow = null) {
  if (parsed.type === "set_operation") {
    return executeSetOperation(parsed, tables, outerRow);
  }

  // Resolve the source row set: a real table or a derived-table result.
  let source;
  if (parsed.derivedTable) {
    const derived = executeBoundQuery(parsed.derivedTable, tables, null);
    source = derived.rows;
  } else {
    source = tables[parsed.table];
    if (!source) throw new Error(`Unknown table: ${parsed.table}`);
  }

  for (const j of (parsed.joins || [])) {
    if (!tables[j.table]) throw new Error(`Unknown table: ${j.table}`);
  }

  const isJoined = (parsed.joins || []).length > 0;

  let rows = isJoined ? buildJoinedRows(parsed, tables, source) : source;

  // Merge the outer row's (already-prefixed) keys into each inner row so column
  // lookups resolve from one map at eval time.
  if (outerRow) {
    const prefixedOuter = prefixOuterRow(outerRow);
    rows = rows.map((r) => ({ ...prefixedOuter, ...r }));
  }

  const ctx = { tables };

  if (parsed.where) rows = rows.filter((row) => evalExpr(parsed.where, row, ctx));

  // ---------- Aggregate / GROUP BY path ----------
  if (parsed.isAggregate) {
    const groupSet = new Set(parsed.groupBy || []);
    for (const it of parsed.selectItems) {
      if (!exprValidInAggregateSelect(it.expr, groupSet)) {
        const badName = it.expr.type === "col" ? it.expr.name : exprDefaultName(it.expr);
        throw new Error(`SELECT item "${badName}" must be aggregated or appear in GROUP BY`);
      }
    }

    let groups;
    if (parsed.groupBy && parsed.groupBy.length) {
      const m = new Map();
      for (const r of rows) {
        const key = parsed.groupBy.map((c) => (r[c] == null ? " NULL" : String(r[c]))).join("|");
        if (!m.has(key)) m.set(key, []);
        m.get(key).push(r);
      }
      groups = [...m.values()];
    } else {
      groups = rows.length > 0 ? [rows] : [[]];
    }

    if (parsed.having) {
      groups = groups.filter((g) => evalHaving(parsed.having, g, ctx));
    }

    const outCols = parsed.selectItems.map((it) => it.outName);
    let outRows = groups.map((g) => {
      const o = {};
      for (const it of parsed.selectItems) o[it.outName] = evalAggOnGroup(it.expr, g, ctx);
      return o;
    });

    if (parsed.orderBy && parsed.orderBy.length) {
      for (const { column } of parsed.orderBy) {
        if (!outCols.includes(column)) {
          throw new Error(`ORDER BY column "${column}" must be in the SELECT list`);
        }
      }
      outRows = sortRowsBy(outRows, parsed.orderBy);
    }

    if (parsed.limit != null) outRows = outRows.slice(0, parsed.limit);
    return { columns: outCols, rows: outRows };
  }

  // ---------- Non-aggregate path ----------
  let outCols, outRows;
  if (parsed.isStar) {
    if (rows.length) {
      outCols = Object.keys(rows[0]).filter((k) => !k.startsWith(OUTER_PREFIX));
    } else if (!isJoined && source.length) {
      outCols = Object.keys(source[0]);
    } else {
      outCols = [];
    }
    outRows = rows.map((row) => {
      const o = {};
      for (const c of outCols) o[c] = row[c];
      return o;
    });
  } else {
    outCols = parsed.selectItems.map((it) => it.outName);
    outRows = rows.map((row) => {
      const o = {};
      for (const it of parsed.selectItems) {
        o[it.outName] = evalValueExpr(it.expr, row, ctx);
      }
      return o;
    });
  }

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

  if (parsed.limit != null) outRows = outRows.slice(0, parsed.limit);
  return { columns: outCols, rows: outRows };
}

export function executeQuery(sql, tables) {
  const parsed = parseQuery(sql);
  bindParsed(parsed, tables, null);
  return executeBoundQuery(parsed, tables, null);
}
