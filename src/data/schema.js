// ============================================================
// SCHEMA — table/column/relationship metadata for the ER diagram
// Used by REAL WORLD challenges where the learner sees only the
// schema (no source data) and translates a business question to SQL.
// ============================================================

export const SCHEMA = {
  shows: {
    columns: [
      { name: "id",             type: "INT",          pk: true },
      { name: "name",           type: "VARCHAR" },
      { name: "genre",          type: "VARCHAR" },
      { name: "imdb_rating",    type: "DECIMAL" },
      { name: "certificate",    type: "VARCHAR" },
      { name: "premiere_year",  type: "INT" },
      { name: "finale_year",    type: "INT (nullable)" },
      { name: "episode_count",  type: "INT" },
      { name: "overview",       type: "TEXT" },
    ],
  },
  episodes: {
    columns: [
      { name: "id",          type: "INT",     pk: true },
      { name: "show_id",     type: "INT",     fk: "shows.id" },
      { name: "season",      type: "INT" },
      { name: "episode",     type: "INT" },
      { name: "title",       type: "VARCHAR" },
      { name: "air_date",    type: "DATE" },
      { name: "runtime_min", type: "INT" },
      { name: "rating",      type: "DECIMAL" },
    ],
  },
  reviews: {
    columns: [
      { name: "id",      type: "INT",     pk: true },
      { name: "show_id", type: "INT",     fk: "shows.id" },
      { name: "viewer",  type: "VARCHAR" },
      { name: "rating",  type: "INT" },
      { name: "review",  type: "TEXT" },
    ],
  },
  daily_metrics: {
    columns: [
      { name: "show_id",     type: "INT",     fk: "shows.id" },
      { name: "metric_date", type: "DATE" },
      { name: "views",       type: "INT" },
      { name: "new_subs",    type: "INT" },
      { name: "revenue",     type: "DECIMAL" },
    ],
  },
};

// Relationships (drawn as lines on the ER diagram).
// `label` shows next to the line; `from`/`to` are table names.
export const RELATIONSHIPS = [
  { from: "episodes",      fromCol: "show_id", to: "shows", toCol: "id", label: "belongs to" },
  { from: "reviews",       fromCol: "show_id", to: "shows", toCol: "id", label: "reviews" },
  { from: "daily_metrics", fromCol: "show_id", to: "shows", toCol: "id", label: "metrics for" },
];
