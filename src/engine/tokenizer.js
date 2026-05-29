// ============================================================
// SQL ENGINE — tokenize → parse → evaluate
// Supports: SELECT cols|*, FROM table, optional WHERE with
//   = != <> > < >= <= , AND OR NOT, IS [NOT] NULL, LIKE, IN, BETWEEN
// ============================================================

export function tokenize(sql) {
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
    if (c === ".") { tokens.push({ type: "dot" });   i++; continue; }
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
