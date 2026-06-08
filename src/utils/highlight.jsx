// ============================================================
// SQL SYNTAX HIGHLIGHTING
// ============================================================

export const SQL_KEYWORDS = [
  "select", "from", "where", "and", "or", "not", "is", "null", "like", "in", "between",
  "order", "by", "group", "having", "limit", "offset", "asc", "desc", "distinct",
  "join", "on", "inner", "left", "right", "outer", "full", "cross", "as",
  "case", "when", "then", "else", "end", "union", "intersect", "except", "all", "exists",
  // Aggregate + scalar functions the engine understands — colour these too so
  // queries don't look half-highlighted.
  "count", "sum", "avg", "min", "max", "round",
  // Window functions + OVER clause keywords.
  "rank", "dense_rank", "row_number", "ntile", "percent_rank", "lag", "lead",
  "over", "partition", "rows", "preceding", "following", "unbounded", "current", "row",
  // CTEs, date/string functions, and COALESCE.
  "with", "extract", "for",
  "upper", "lower", "length", "trim", "substring", "concat", "replace", "split_part", "coalesce",
];
export const KW_RE = new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi");

export function tokenizeForHighlight(text) {
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

export function HighlightedSql({ text }) {
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
