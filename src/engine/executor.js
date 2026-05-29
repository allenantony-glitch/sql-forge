import { parseQuery, exprDefaultName, exprValidInAggregateSelect } from './parser';
import { TABLE_COLUMN_ORDER } from '../data/shows';
import { rowKey } from './comparator';

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

export function evalExpr(expr, row) {
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

// Evaluate a value-yielding expression against a single row (no aggregates).
export function evalValueExpr(expr, row) {
  switch (expr.type) {
    case "literal": return expr.value;
    case "col":     return row[expr.name];
    case "func":
      if (expr.name === "round") {
        const v = evalValueExpr(expr.args[0], row);
        const d = evalValueExpr(expr.args[1], row);
        if (v == null) return null;
        return Number(Number(v).toFixed(d));
      }
      throw new Error(`Unknown function: ${expr.name}`);
    case "case":
      for (const b of expr.branches) {
        if (evalExpr(b.when, row)) return evalValueExpr(b.then, row);
      }
      return expr.else ? evalValueExpr(expr.else, row) : null;
    default:
      throw new Error(`Cannot evaluate expression of type ${expr.type}`);
  }
}

// Evaluate an expression (possibly containing aggregates) over a group of rows.
export function evalAggOnGroup(expr, groupRows) {
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
      // sum/avg/min/max can wrap a bare column or a value-yielding expression
      // (e.g. SUM(CASE WHEN cond THEN 1 ELSE 0 END)). The latter is evaluated
      // per row of the group before aggregation.
      const vals = expr.arg.type === "col"
        ? groupRows.map((r) => r[expr.arg.name]).filter((v) => v != null)
        : groupRows.map((r) => evalValueExpr(expr.arg, r)).filter((v) => v != null);
      if (vals.length === 0) return null;
      if (f === "sum") return vals.reduce((a, b) => a + b, 0);
      if (f === "avg") return vals.reduce((a, b) => a + b, 0) / vals.length;
      if (f === "min") return vals.reduce((a, b) => (b < a ? b : a));
      if (f === "max") return vals.reduce((a, b) => (b > a ? b : a));
      throw new Error(`Unknown aggregate: ${f}`);
    }
    case "func":
      if (expr.name === "round") {
        const v = evalAggOnGroup(expr.args[0], groupRows);
        const d = evalAggOnGroup(expr.args[1], groupRows);
        if (v == null) return null;
        return Number(Number(v).toFixed(d));
      }
      throw new Error(`Unknown function: ${expr.name}`);
    case "case":
      for (const b of expr.branches) {
        // Per-group: evaluate the WHEN against the first row of the group.
        if (groupRows.length > 0 && evalExpr(b.when, groupRows[0])) {
          return evalAggOnGroup(b.then, groupRows);
        }
      }
      return expr.else ? evalAggOnGroup(expr.else, groupRows) : null;
    default:
      throw new Error(`Cannot evaluate aggregate expression of type ${expr.type}`);
  }
}

export function evalHaving(expr, groupRows) {
  switch (expr.type) {
    case "and": return evalHaving(expr.left, groupRows) && evalHaving(expr.right, groupRows);
    case "or":  return evalHaving(expr.left, groupRows) || evalHaving(expr.right, groupRows);
    case "not": return !evalHaving(expr.expr, groupRows);
    case "compare_expr": {
      const v = evalAggOnGroup(expr.left, groupRows);
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

// ----- bind: walk the parsed AST and rewrite every column reference (qualifier
//       + bare name) into a final row-key string. For single-table queries the
//       key is the bare name; for joined queries it's "alias.name" so it
//       matches the prefixed keys of the joined row set.
export function bindAllColumns(parsed, bindCol) {
  function walkWhere(e) {
    if (!e) return;
    switch (e.type) {
      case "and": case "or": walkWhere(e.left); walkWhere(e.right); break;
      case "not": walkWhere(e.expr); break;
      case "compare": case "is_null": case "like":
      case "in": case "not_in": case "between":
        e.column = bindCol(e.qualifier, e.column);
        e.qualifier = null;
        break;
      case "compare_expr": walkValue(e.left); break;
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
    }
  }
  if (parsed.where) walkWhere(parsed.where);
  if (parsed.having) walkWhere(parsed.having);
  for (const it of parsed.selectItems) walkValue(it.expr);
  if (parsed.groupBy) {
    parsed.groupBy = parsed.groupBy.map((g) => bindCol(g.qualifier, g.name));
  }
  for (const j of (parsed.joins || [])) {
    j.leftRef.bound  = bindCol(j.leftRef.qualifier,  j.leftRef.name);
    j.rightRef.bound = bindCol(j.rightRef.qualifier, j.rightRef.name);
  }
  // ORDER BY references output columns (aliases) — leave as bare names and let
  // the outCols.includes() check validate them at result-shaping time.
}

// Build a single combined row set from FROM + JOINs. Every row has keys
// prefixed by the table alias (e.g. "s.name", "e.title"). For LEFT JOIN
// unmatched rows on the right, all right-side keys are set to null.
export function buildJoinedRows(parsed, tables) {
  const prefix = (row, alias) => {
    const out = {};
    for (const k of Object.keys(row)) out[`${alias}.${k}`] = row[k];
    return out;
  };
  let rows = (tables[parsed.table] || []).map((r) => prefix(r, parsed.fromAlias));
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

export function executeQuery(sql, tables) {
  const parsed = parseQuery(sql);
  const source = tables[parsed.table];
  if (!source) throw new Error(`Unknown table: ${parsed.table}`);
  for (const j of (parsed.joins || [])) {
    if (!tables[j.table]) throw new Error(`Unknown table: ${j.table}`);
  }

  // Build the alias → columns scope used by bindCol below.
  const isJoined = (parsed.joins || []).length > 0;
  const aliases = [parsed.fromAlias, ...(parsed.joins || []).map((j) => j.alias)];
  const tableNameByAlias = { [parsed.fromAlias]: parsed.table };
  for (const j of (parsed.joins || [])) tableNameByAlias[j.alias] = j.table;
  const columnsByAlias = {};
  for (const a of aliases) {
    const tname = tableNameByAlias[a];
    columnsByAlias[a] =
      TABLE_COLUMN_ORDER[tname] ||
      (tables[tname] && tables[tname][0] ? Object.keys(tables[tname][0]) : []);
  }

  function bindCol(qualifier, name) {
    if (qualifier) {
      if (!aliases.includes(qualifier)) {
        throw new Error(`Unknown table alias: ${qualifier}`);
      }
      if (!columnsByAlias[qualifier].includes(name)) {
        throw new Error(`Unknown column: ${qualifier}.${name}`);
      }
      return isJoined ? `${qualifier}.${name}` : name;
    }
    const matches = aliases.filter((a) => columnsByAlias[a].includes(name));
    if (matches.length === 0) throw new Error(`Unknown column: ${name}`);
    if (matches.length > 1) {
      throw new Error(`Ambiguous column reference "${name}" — qualify with an alias (e.g. ${matches[0]}.${name})`);
    }
    return isJoined ? `${matches[0]}.${name}` : name;
  }

  bindAllColumns(parsed, bindCol);

  // Build the row set: single-table uses the source directly; joined queries
  // produce a combined row set with prefixed column keys.
  let rows = isJoined ? buildJoinedRows(parsed, tables) : source;
  if (parsed.where) rows = rows.filter((row) => evalExpr(parsed.where, row));

  // ---------- Aggregate / GROUP BY path ----------
  if (parsed.isAggregate) {
    const groupSet = new Set(parsed.groupBy || []);
    for (const it of parsed.selectItems) {
      if (!exprValidInAggregateSelect(it.expr, groupSet)) {
        const badName = it.expr.type === "col" ? it.expr.name : exprDefaultName(it.expr);
        throw new Error(`SELECT item "${badName}" must be aggregated or appear in GROUP BY`);
      }
    }

    // Form groups. With no GROUP BY but aggregates present, all rows form one group.
    let groups;
    if (parsed.groupBy && parsed.groupBy.length) {
      const m = new Map();
      for (const r of rows) {
        const key = parsed.groupBy.map((c) => (r[c] == null ? " NULL" : String(r[c]))).join("|");
        if (!m.has(key)) m.set(key, []);
        m.get(key).push(r);
      }
      groups = [...m.values()];
    } else {
      groups = rows.length > 0 ? [rows] : [[]]; // single group, even if empty, so COUNT(*) → 0
    }

    if (parsed.having) {
      groups = groups.filter((g) => evalHaving(parsed.having, g));
    }

    const outCols = parsed.selectItems.map((it) => it.outName);
    let outRows = groups.map((g) => {
      const o = {};
      for (const it of parsed.selectItems) o[it.outName] = evalAggOnGroup(it.expr, g);
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

  // ---------- Non-aggregate path (Layer 1 shape) ----------
  let srcCols;
  if (parsed.isStar) {
    // SELECT * on joined rows would yield prefixed keys; we have no challenges
    // exercising that, but supporting it keeps the engine consistent.
    if (isJoined && rows.length) srcCols = Object.keys(rows[0]);
    else srcCols = source.length ? Object.keys(source[0]) : [];
  } else {
    srcCols = parsed.selectItems.map((it) => {
      if (it.expr.type !== "col") {
        throw new Error(`Unsupported non-aggregate expression in SELECT: ${exprDefaultName(it.expr)}`);
      }
      // After bindAllColumns, expr.name is the actual row key ("s.name" for
      // joined queries, "name" for single-table).
      return it.expr.name;
    });
  }

  // outName was set at parse time from the BARE column name (or AS alias), so
  // `SELECT s.name` outputs "name" rather than "s.name".
  const outCols = parsed.isStar
    ? srcCols.slice()
    : parsed.selectItems.map((it) => it.outName);

  let outRows = rows.map((row) => {
    const o = {};
    for (let i = 0; i < srcCols.length; i++) o[outCols[i]] = row[srcCols[i]];
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

  if (parsed.limit != null) outRows = outRows.slice(0, parsed.limit);

  return { columns: outCols, rows: outRows };
}
