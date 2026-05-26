# SQL Forge — The Complete Prompt (v4 Final — Maximum Internalization)

## Build a gamified, visual, interactive learning app called "SQL Forge" that teaches SQL from basic to advanced through visual problem-solving, conceptual reasoning, and deep internalization — not memorization.

**Tech:** React (single JSX file), Tailwind CSS, CSS animations (no heavy libraries). No localStorage — use `useState`/`useReducer` for session state, `window.storage` for persistence across sessions.

---

## Core Philosophy: The Internalization Stack

Most SQL learning follows this path:
```
See syntax → Memorize syntax → Recall syntax on test
```
That's fragile. Under pressure (interviews, timed tests) it collapses because there's no understanding underneath.

**SQL Forge follows a different path:**
```
1. SEE the data transformation visually (what needs to happen)
2. THINK about the operation conceptually (what kind of operation is this)
3. BUILD the execution plan visually (what order do operations happen)
4. WRITE the SQL (translate the plan to syntax)
5. WATCH the animation confirm (visual proof reinforces the mental model)
6. ENCOUNTER the same concept in different disguises (transfer, not pattern-match)
7. EXPLAIN failures conceptually (diagnose with understanding, not guess-and-check)
8. CHOOSE between approaches (understand tradeoffs, not just "the right answer")
9. TEACH it back in your own words (if you can explain it, you own it)
10. SOLVE with fading scaffolding (full target → faded shape → no target)
```

Steps 1-3 and 6-10 are where internalization happens. Step 4 is syntax — unavoidable but minimal. Step 5 is reinforcement.

**The app's job is to spend 85%+ of the learner's time on steps 1-3 and 6-10, and minimize time on step 4.**

---

## The Story & Visual World

You are a **Data Alchemist** — someone who can see raw data flowing through underground pipes in the **Data Mine**. Each challenge presents a visual puzzle: data is stuck, scattered, tangled, or hidden. Your SQL query is the spell that transforms it.

**Visual world:** Cross-section of an underground mine, stylized 2D. Tables are mineral veins (horizontal layers of colored rows embedded in rock). Columns are distinct strata. The mine goes deeper as the learner progresses.

---

## The Nine Challenge Types

This is the core innovation. Instead of one challenge type ("write the query"), there are NINE types that attack internalization from different angles. The app cycles through all nine, never letting the learner settle into rote pattern-matching.

---

### Type 1: TRANSFORM (30% of challenges)
**"See source → see target → figure out the query"**

The learner sees the source table(s) and the target result table side by side. No instructions. No hints about which clauses to use. The visual difference between source and target IS the puzzle.

The learner must:
1. Notice what changed (fewer rows? fewer columns? new values? different order? wider table?)
2. Infer which operations caused the change
3. Write the query

**What this teaches:** Pattern recognition. "Fewer rows = filter. Fewer columns = select. New computed values = aggregate. Wider table = join." This becomes automatic over time — the learner starts SEEING operations in data shapes.

**Visual feedback on correct:** The source animates into the target (rows filter, columns select, groups merge, tables join — each with its own distinct animation). The transformation IS the reward.

**Visual feedback on wrong:** The learner's result appears next to the target. They can visually compare: "I got 8 rows but needed 3" or "My values are wrong in column 3." No abstract error — they SEE the mismatch.

---

### Type 2: OPERATION BUILDER (20% of challenges)
**"Build the execution plan BEFORE writing any SQL"**

The learner sees source and target. But instead of jumping to SQL, they must first BUILD the transformation pipeline by dragging operation blocks into a sequence.

Available operation blocks (visual, labeled icons — not SQL keywords):
- 🔽 **FILTER ROWS** (= WHERE)
- 📊 **GROUP & COMPUTE** (= GROUP BY + aggregates)
- 🛡️ **FILTER GROUPS** (= HAVING)
- ↕️ **SORT** (= ORDER BY)
- ✂️ **LIMIT** (= LIMIT)
- 📐 **SELECT COLUMNS** (= SELECT)
- 🔗 **CONNECT TABLES** (= JOIN)
- 🪟 **WINDOW COMPUTE** (= window function)
- 📦 **INTERMEDIATE STEP** (= CTE)
- 🔎 **INNER QUERY** (= subquery)

The learner drags these into a vertical pipeline between source and target. The ORDER matters — if they put FILTER GROUPS before GROUP & COMPUTE, the pipeline shows a red "X" and explains: "You can't filter groups that don't exist yet. Group first, then filter."

**After building the correct pipeline, THEN they write the SQL.** But now the SQL is just translating a plan they already understand into syntax. The hard part (figuring out WHAT to do and in WHAT ORDER) is already done.

**What this teaches:** SQL execution order as an intuitive concept, not a memorized list. The learner internalizes: "FROM happens first, then WHERE, then GROUP BY, then HAVING, then SELECT, then ORDER BY, then LIMIT" — not because they memorized it, but because they built it with their hands dozens of times.

**When this type appears:** Every time a new concept is introduced, the first 2-3 challenges use this type. This ensures the learner understands the CONCEPT before they deal with syntax. Also appears randomly throughout to reinforce execution order.

---

### Type 3: PREDICT (12% of challenges)
**"Given this query and this source, BUILD the result by hand."**

A complete SQL query is shown. The source table is shown. The learner must BUILD the result — no multiple choice, no picking from options.

**How building works (the learner physically constructs the output):**

The learner sees an empty result grid below the source. They must:
1. **Select which columns appear** — drag column headers from the source into the result grid header
2. **Select which rows survive** — drag entire rows from the source into the result area (for WHERE/JOIN) or mark rows as "included" / "excluded"
3. **Form groups manually** — for GROUP BY queries, drag rows into group buckets, then TYPE the aggregate value themselves. If the query says `AVG(imdb_rating)` for a group of three shows rated 7.2, 8.4, 9.0: the learner must mentally compute (7.2 + 8.4 + 9.0) / 3 = 8.2 and type "8.2" into the aggregate cell. **No calculator. They do the math.**
4. **Order rows** — drag rows into the correct sort order
5. **Add computed columns** — for window functions, type the rank/lag/running total value for each row

**What this teaches:** TRUE mental execution of SQL. The learner becomes a human SQL engine. They can't bluff through this — if they don't understand what GROUP BY + AVG actually DOES at a mechanical level, they can't build the output. This is the deepest form of comprehension: not "I recognize the right answer" but "I can produce the right answer from scratch."

**Why no multiple choice, ever:** Picking from 3 options is recognition, not recall. With 3 options, there's a 33% chance of guessing right. With building, there's zero chance — you either understand the query or you don't. Every PREDICT challenge requires construction.

**Difficulty scaling:**
- Layer 1: Simple builds — drag 3-4 rows, no computation
- Layer 2: Aggregate builds — form groups, compute COUNT/AVG by hand for small groups (3-5 rows per group)
- Layer 3: JOIN builds — connect matching rows from two tables, decide which survive
- Layer 4-5: Complex builds — multi-step construction with subquery results feeding outer queries, window function values computed per-row

**After correct build:** The animation plays, confirming their manual construction. The learner sees "yes, the database does exactly what I just did by hand." This creates a rock-solid mental model.

---

### Type 4: WRONG TOOL (10% of challenges)
**"The obvious approach is wrong. Find the right one."**

The learner sees source and target. The target deliberately LOOKS like it needs one approach, but that approach fails.

**Examples:**

**"Looks like GROUP BY, needs a window function":**
Source: employees with departments and salaries
Target: every employee row PLUS a new column showing their department's average salary
The learner's first instinct: GROUP BY department, AVG(salary). But that collapses rows — the target has ALL original rows. They need a window function. The animation shows their GROUP BY attempt collapsing the rows, visually destroying data they need. Then the window function animation shows the value being added WITHOUT collapsing. **The difference between "reduce" and "enrich" clicks permanently.**

**"Looks like WHERE, needs HAVING":**
Source: sales table
Target: customers with total purchases above $1000
First instinct: WHERE total > 1000. But "total" doesn't exist as a column — it must be computed by SUM(amount) per customer first. WHERE can't filter on an aggregate. The animation shows WHERE trying to fire but finding no "total" column (ghostly missing reference animation). HAVING works because it fires after GROUP BY.

**"Looks like INNER JOIN, needs LEFT JOIN":**
Target includes rows with NULL values in the right-side columns. INNER JOIN drops them. The learner sees their result is missing rows and must switch to LEFT JOIN.

**What this teaches:** Anti-patterns. Knowing when NOT to use something is deeper than knowing when to use it. These challenges build judgment, not just recall. They also inoculate against the most common HackerRank mistakes.

---

### Type 5: MANY ROADS (10% of challenges)
**"Here are 3 queries that produce the same result. Understand why."**

The source, target, and THREE different valid queries are shown. Each query animates differently:

**Example: "Find shows with no reviews"**
```sql
-- Approach A: LEFT JOIN + IS NULL
SELECT s.name FROM shows s
LEFT JOIN reviews r ON s.id = r.show_id
WHERE r.id IS NULL;

-- Approach B: NOT EXISTS
SELECT s.name FROM shows s
WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.show_id = s.id);

-- Approach C: NOT IN
SELECT s.name FROM shows s
WHERE s.id NOT IN (SELECT show_id FROM reviews);
```

Each approach animates differently:
- **A:** Two tables slide together, unmatched rows get NULL right-side, then WHERE keeps only NULL rows
- **B:** For each show row, a spotlight shines into the reviews table looking for matches. No match found → row stays. Match found → row fades.
- **C:** The subquery produces a list of IDs. Those IDs float down and "block" matching shows. Unblocked shows remain.

Same result, three different MECHANISMS. The learner watches all three, then answers: "Which approach would be fastest if the reviews table had 10 million rows?" (NOT EXISTS, because it stops searching as soon as it finds one match — the spotlight animation makes this intuitive.)

**What this teaches:** There isn't "one right answer" in SQL. Different approaches have different mental models and different performance characteristics. The learner develops FLEXIBILITY — they can reach for any of three tools depending on context. This is what separates "I know SQL" from "I think in SQL."

**After watching all three animations, the learner writes ONE of the approaches from scratch (they choose which). On future challenges, if they always pick the same approach, the app gently suggests: "You've used LEFT JOIN + IS NULL three times. Try NOT EXISTS this time." This prevents pattern-locking.**

---

### Type 6: DIAGNOSE (10% of challenges)
**"A query produces wrong results. Don't fix it — EXPLAIN what went wrong."**

A query, source table, wrong result, and correct target are shown. The wrong result animates, showing exactly where the query goes off-track.

The learner must select the CONCEPTUAL diagnosis from options:

**Example:**
```sql
SELECT certificate, COUNT(*) AS cnt
FROM shows
WHERE cnt > 3
GROUP BY certificate;
```
Error shown: query fails.

Options:
- A) "The alias `cnt` doesn't exist yet when WHERE runs because WHERE executes before SELECT"
- B) "COUNT(*) can't be used with GROUP BY"
- C) "WHERE is the wrong keyword for filtering aggregated results"
- D) Both A and C describe the same underlying issue

Answer: D. Both A and C are correct perspectives on the same problem. A describes the execution order issue. C describes the conceptual solution (use HAVING instead).

**What this teaches:** Conceptual debugging. The learner doesn't just learn the fix — they learn to ARTICULATE why something is wrong. Being able to explain "WHERE runs before GROUP BY, so aggregate aliases don't exist yet, and even if they did, aggregate filtering belongs in HAVING" means the learner UNDERSTANDS execution order. They'll never make this mistake again, not because they memorized "use HAVING not WHERE for aggregates," but because they understand the WHY.

**The visual plays a crucial role:** The animation shows WHERE trying to fire at the wrong stage. The learner SEES the execution order violation. This creates a visceral memory — "I remember seeing WHERE fire too early" — which is stickier than "I remember reading that WHERE runs before GROUP BY."

---

### Type 7: REAL WORLD (5% of challenges — unlocked after Layer 3)
**"Here's a business question. No tables. No target. Figure it out."**

A plain English question is presented, along with a database schema (table names, columns, types, relationships shown as a visual entity-relationship diagram). No source data shown. No target shown.

Example: *"The product team wants to know: which shows are trending down? Specifically, find shows where viewership in the last 30 days is lower than the 30 days before that. Show the show name, recent views, and previous views."*

The learner must:
1. **Identify which tables are needed** (select from the schema diagram)
2. **Build the operation pipeline** (using the Operation Builder)
3. **Write the query**
4. **See the result** (now the source data appears and the animation plays)

**What this teaches:** The complete skill. In real work and in HackerRank, nobody gives you the source data and target side by side. You get a question and a schema. You must translate a BUSINESS QUESTION into SQL. This is the ultimate internalization test — the learner must understand what the question is asking, figure out which data structures are relevant, plan the operations, and execute. If they can do this, they can do anything.

**These challenges appear sparingly but are the highest-value learning moments.** Each one is worth significant progress on multiple gems simultaneously.

---

### Type 8: TEACH-BACK (5% of challenges — unlocked after Layer 2)
**"Explain this concept to someone else. In your own words."**

The deepest form of understanding is being able to explain something simply. If you can teach it, you know it.

**How it works:**

A concept is presented alongside a visual scenario. The learner must write a 1-3 sentence explanation in plain English. The explanation is validated using Claude's API (a lightweight call that checks for semantic correctness, not exact wording).

**Examples:**

**Scenario:** Two animations play side by side. Left: a GROUP BY query where rows merge into fewer rows with aggregate values. Right: a window function query where rows STAY but gain a new column.
**Prompt:** "A junior developer asks: 'What's the difference between GROUP BY and window functions? They both seem to compute aggregates.' Explain it to them in 1-2 sentences."
**Good answer (validated semantically):** "GROUP BY collapses multiple rows into one row per group, so you lose individual row detail. Window functions compute the same aggregates but keep every row — each row gets the computed value added as a new column."
**Validation:** The API checks for key concepts: (1) GROUP BY reduces/collapses rows, (2) window functions preserve rows, (3) both compute aggregates. It does NOT check for exact wording — the learner uses their own language.

**More examples:**

**Prompt:** "Why can't you use WHERE to filter on COUNT(*)? Explain the root cause."
**Expected concepts:** Execution order — WHERE runs before GROUP BY, so aggregates haven't been computed yet.

**Prompt:** "A query uses INNER JOIN and returns 8 rows. Switching to LEFT JOIN returns 12 rows. Why did 4 rows appear?"
**Expected concepts:** LEFT JOIN keeps unmatched rows from the left table; INNER JOIN drops them. The 4 new rows have no match in the right table.

**Prompt:** "When would you use NOT EXISTS instead of NOT IN?"
**Expected concepts:** NOT IN can give unexpected results if the subquery contains NULL values (everything returns no rows). NOT EXISTS handles NULLs safely. NOT EXISTS can also be faster because it stops searching at the first match.

**What this teaches:** Articulation forces crystallization. The learner can't hide behind "I sort of get it." They must organize their understanding into clear language. This process itself deepens comprehension — you often discover gaps in your own understanding while trying to explain something.

**The API validation is generous, not pedantic.** It checks for conceptual correctness, not grammar, not specific terminology, not exact phrasing. "GROUP BY squishes rows together, window functions don't" is a valid explanation if the core concept is present. The goal is understanding, not formal language.

**If the explanation is wrong or missing key concepts:** The app shows which concepts were missing (e.g., "You explained that GROUP BY reduces rows — good! But you didn't mention that window functions KEEP all rows. That's the key contrast."). The learner revises. They're never shown a "model answer" — they must find the words themselves.

**Gem earned: "Teacher" gem (🎓, warm white glow).** This gem only brightens through TEACH-BACK challenges. It represents meta-understanding — knowing something well enough to explain it.

---

### Type 9: FADED TARGET (3% of challenges — unlocked after Layer 3)
**"You know the shape. Fill in the substance."**

This is the bridge between fully-scaffolded challenges (source + target visible) and fully-unscaffolded REAL WORLD challenges (no target at all). The transition in v3 was too abrupt — this smooths the ramp.

**How it works:**

The source table is shown normally. The target table is shown as a **faded silhouette** — the learner can see:
- How many columns the result has (column outlines visible, headers may be shown or hidden)
- How many rows the result has (row outlines visible)
- Column types (number cells are right-aligned placeholders, string cells are left-aligned placeholders)
- Optionally: which column the result is sorted by (a small arrow on the column header)

But the actual VALUES are hidden. Every cell shows a dim placeholder ("—" or a blurred block).

**Example:**

Source: Full `shows` table (15 rows, 8 columns)
Faded target: 4 rows, 2 columns (string + number). Sorted by the number column descending.

The learner can infer from the shape:
- "Only 2 columns → I need SELECT specific columns"
- "Only 4 rows → I need to filter (WHERE) or limit (LIMIT) or both"
- "Sorted by number descending → ORDER BY ... DESC"
- "4 out of 15 rows → probably a WHERE filter, not just LIMIT"

But they DON'T know: which columns, what the filter condition is, or what specific values appear. They must figure that out from the task description (a short sentence like: "Find the highest-rated shows that are still airing").

**Scaffolding levels (the app progressively fades the target across layers):**

| Level | What's visible | When it appears |
|-------|---------------|-----------------|
| **Full target** | All values, columns, rows | Layers 1-2 (all challenges) |
| **Labeled fade** | Column headers shown, row count shown, values hidden | Layer 3 (some challenges) |
| **Shape-only fade** | Column count + types shown, row count shown, no headers, no values | Layer 4 (some challenges) |
| **Row-count-only fade** | Only the number of result rows shown, nothing else | Layer 4-5 (some challenges) |
| **No target** | Nothing — only the business question | Layer 5 REAL WORLD challenges |

**This creates a 5-step scaffolding ramp:**
```
Full target → Labeled fade → Shape-only fade → Row-count-only → No target
   Layer 1-2     Layer 3          Layer 4          Layer 4-5      Layer 5
```

The learner doesn't notice the scaffolding being removed. Each step feels only slightly harder than the last. By the time they hit REAL WORLD challenges with no target at all, they've been gradually weaned off the visual crutch and barely miss it.

**What this teaches:** Self-sufficiency. The full target is a powerful learning tool — but it's also a crutch. In real work, nobody shows you the expected output. The faded target teaches the learner to work from partial information, which is the actual skill of SQL problem-solving.

---

## Challenge Type Distribution by Layer

| Layer | TRANSFORM | OP BUILDER | PREDICT | WRONG TOOL | MANY ROADS | DIAGNOSE | TEACH-BACK | FADED TARGET | REAL WORLD |
|-------|-----------|------------|---------|------------|------------|----------|------------|-------------|------------|
| 1 (Surface) | 35% | 30% | 20% | 10% | 0% | 0% | 0% | 0% | 0% |
| 2 (Upper Mine) | 25% | 22% | 13% | 13% | 5% | 10% | 5% | 0% | 0% |
| 3 (Crossroads) | 20% | 17% | 12% | 10% | 12% | 8% | 6% | 8% | 5% |
| 4 (Deep Shafts) | 18% | 12% | 10% | 10% | 12% | 10% | 6% | 12% | 8% |
| 5 (The Core) | 15% | 8% | 8% | 8% | 10% | 10% | 8% | 10% | 18% |

**Reading the table:** Layer 1 is mostly TRANSFORM + OPERATION BUILDER (learning by doing with full scaffolding). By Layer 5, the challenge types are diversified — REAL WORLD and FADED TARGET make up 28%, TEACH-BACK and DIAGNOSE make up 18%, and even TRANSFORM challenges at this level involve complex multi-concept queries. The scaffolding dissolves gradually.

---

## The Visual Feedback System

### Table Rendering

Tables are rendered as stylized data grids embedded in the mine aesthetic:
- Rows are horizontal bands with subtle color variation (alternating warm stone tones)
- Column headers are inset in darker rock above the data
- NULL values rendered as visually distinct dark/hollow cells with a subtle dashed border — NOT the text "NULL"
- Numeric values right-aligned, strings left-aligned
- Matching values across tables (join keys) share a subtle color accent so the learner can spot relationships

### Animation Specifications Per SQL Concept

**WHERE (filtering rows):**
Each filtered row: opacity 1→0 over 400ms with translateY(20px) like sediment falling away. Staggered 50ms per row for a cascading effect. Remaining rows: translateY to close gaps over 300ms ease-in-out.

**SELECT (column selection):**
Unselected columns: width collapses to 0 over 400ms with opacity fade. Selected columns expand to fill over 300ms.

**ORDER BY (sorting):**
Rows lift slightly (translateY(-3px) + subtle box-shadow growth), then translate to their new positions over 600ms ease-in-out, then settle (shadow fades).

**GROUP BY + aggregates:**
Phase 1 — Grouping: Rows with matching group values are highlighted with the same color. They slide together vertically over 500ms.
Phase 2 — Merging: Stacked same-group rows compress into one row (scaleY shrink) over 400ms. As they merge, a small burst animation shows the aggregate value crystallizing — numbers from each row float out of their cells, converge to a point, and the computed result (count, sum, avg) appears with a flash. **The learner literally WATCHES "5 rows becoming the number 5" or "values 7.2, 8.1, 9.0 averaging into 8.1."**

**HAVING (group filtering):**
After GROUP BY animation completes, a second phase: groups that don't meet the HAVING condition fade out as ENTIRE UNITS — the whole group row drops. Visually identical to WHERE's row-drop animation, but happening to GROUPED rows. **This visual parallel (same animation, different stage) is what teaches WHERE vs HAVING intuitively.**

**INNER JOIN:**
Two tables slide toward each other from left and right over 500ms. SVG connection lines draw between matching rows (stroke-dasharray animation, 300ms). Connected rows merge horizontally (translate + width expansion) over 400ms. Unmatched rows from both sides fade over 300ms.

**LEFT JOIN:**
Same as INNER JOIN, except: unmatched LEFT rows DON'T fade. Instead, their right side fills with dark/hollow NULL cells (fade-in over 200ms). **The learner SEES what "keep all left rows" means — and sees NULL as "absence of data," not a weird value.**

**Subquery:**
A miniature table materializes ABOVE the main query area (scale 0→1, opacity 0→1, over 300ms). The subquery executes with its own mini-animation. Then the result (a value, or a list of values) drops down into the outer query's WHERE/FROM/SELECT with a falling animation (translateY + subtle glow trail). **The learner SEES the subquery resolve first, then its result being used.**

**Window functions:**
A semi-transparent rectangle (the "window frame") fades in over the relevant partition (opacity 0→0.3). Inside the frame, the computation happens (same aggregate animation as GROUP BY — numbers float and compute). But critically: **the rows DON'T collapse.** The computed value appears in a NEW column next to each row within the frame. The frame then slides to the next partition and repeats. **The visual contrast with GROUP BY is unmistakable: GROUP BY merges rows; window functions add columns.**

**CTEs:**
Each CTE materializes as a labeled intermediate table positioned between source and final result (scale 0→1, 300ms). SVG arrows draw from source → CTE 1 → CTE 2 → final result (stroke-dasharray). Each CTE runs its own animation in sequence. **The learner SEES the pipeline — data flowing through named stages.**

**CASE WHEN:**
Each row briefly shows a "speech bubble" annotation (fade in, 200ms) showing the evaluation: "8.5 → Great" or "6.2 → Average." Then the row slides to its new group if GROUP BY follows.

---

## The Concept Gem System

### How Gems Work

When the learner successfully uses a SQL concept, a **gem** animates into their **gem belt** (horizontal bar at the top). Each gem:
- Has a unique color, shape, and name tied to a SQL concept
- GLOWS BRIGHTER with deeper understanding (not just more uses — see brightness rules below)
- DIMS OVER TIME if not used (visual spaced repetition)

### Gem Types

| Gem | Color/Shape | Concept | Earns Brightness From |
|-----|-------------|---------|----------------------|
| **Filter** | Ruby triangle | WHERE | Using in multi-step queries, not just basic |
| **Sort** | Sapphire diamond | ORDER BY | Multi-column sorts, tie-breaking |
| **Select** | Emerald rectangle | SELECT columns | Using with computed expressions, aliases |
| **Group** | Amethyst hexagon | GROUP BY | Combining with HAVING, multi-column groups |
| **Guard** | Topaz shield | HAVING | Correctly choosing HAVING over WHERE |
| **Count** | Pearl circle | Aggregates | Using conditional aggregates (CASE inside SUM) |
| **Bridge** | Cyan bridge | JOIN | Multi-table joins, self-joins |
| **Ghost** | Translucent gray | NULL handling | COALESCE, IS NULL in complex contexts |
| **Nest** | Gold concentric circles | Subqueries | Correlated subqueries, subqueries in FROM |
| **Window** | Glass pane | Window functions | PARTITION BY, frame clauses, multiple functions |
| **Chain** | Silver chain links | CTEs | Multiple CTEs, recursive CTEs |
| **Clock** | Amber clock | Date functions | EXTRACT + GROUP BY combos, date arithmetic |
| **Knife** | Steel blade | String functions | SPLIT_PART, pattern matching, CONCAT |
| **Compass** | Rose gold compass | Execution order | Correct Operation Builder sequences |
| **Lens** | Crystal magnifier | Query reading | Correct PREDICT builds (hand-constructing results) |
| **Anvil** | Iron anvil | Debugging | Correct DIAGNOSE explanations |
| **Map** | Bronze map | Real-world translation | REAL WORLD challenges solved |
| **Teacher** | Warm white mortar board | Concept articulation | Correct TEACH-BACK explanations |
| **Pathfinder** | Smoke quartz compass rose | Working without scaffolding | FADED TARGET challenges solved |

### Brightness Rules (Internalization, Not Repetition)

Gems don't just get brighter from repeating the same thing. They get brighter from DEEPER usage:

**Level 1 — Lit (dim glow):** First correct use in any context.
**Level 2 — Warm:** Used correctly in a TRANSFORM challenge (no explicit instruction).
**Level 3 — Bright:** Used in combination with 2+ other concepts (e.g., WHERE inside a JOIN query, GROUP BY with HAVING). OR correctly hand-built in a PREDICT challenge (manually computing the output).
**Level 4 — Blazing:** Used correctly in a WRONG TOOL challenge (chose correctly when the obvious answer was wrong) OR in a REAL WORLD / FADED TARGET challenge (reduced scaffolding) OR correctly explained in a DIAGNOSE or TEACH-BACK challenge. **Reaching Level 4 requires demonstrating understanding through at least TWO different high-depth challenge types** — solving a WRONG TOOL alone isn't enough; you must also explain (TEACH-BACK/DIAGNOSE) or operate without scaffolding (FADED TARGET/REAL WORLD).

**This means: doing 50 basic WHERE challenges keeps the gem at Level 2.** To reach Level 4, the learner must use WHERE in nuanced, tricky contexts where real understanding is required. Brightness = depth of understanding, not quantity of repetition.

### Gem Dimming (Visual Spaced Repetition)

Gems dim by one level after:
- 3 days of no use (Level 4 → 3)
- 5 days of no use (Level 3 → 2)
- 7 days of no use (Level 2 → 1)
- 14 days of no use (Level 1 → Unlit, but gem stays visible as a shadow)

A dimming gem pulses subtly in the gem belt — the learner notices "my Guard gem is pulsing, it's about to dim." This is the only spaced repetition prompt. No pop-ups. No nagging. Just a visual cue.

**"Gem Polish" mode:** The learner can tap any dim gem to get a challenge specifically targeting that concept. The challenge type is chosen to maximize re-internalization (usually WRONG TOOL or DIAGNOSE — the types that require understanding, not just recall).

---

## The Operation Builder — Detailed Specification

This is the single most important UI component in the app. It's where execution order becomes intuitive.

### Visual Layout

```
┌─────────────────────────────────────────────┐
│  SOURCE TABLE(S)                            │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │ shows            │  │ episodes         │ │
│  └──────────────────┘  └──────────────────┘ │
│                                             │
│  ═══════ OPERATION PIPELINE ═══════         │
│                                             │
│  ┌─ Available Operations ─────────────────┐ │
│  │ 🔗 CONNECT  🔽 FILTER  📊 GROUP       │ │
│  │ 🛡️ GUARD    📐 SELECT  ↕️ SORT        │ │
│  │ ✂️ LIMIT    🪟 WINDOW  📦 STEP        │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  Drop zone (vertical slots):                │
│  ┌──────────────┐                           │
│  │  Slot 1      │  ← drag operation here    │
│  ├──────────────┤                           │
│  │  Slot 2      │                           │
│  ├──────────────┤                           │
│  │  Slot 3      │                           │
│  └──────────────┘                           │
│  [+ Add slot]                               │
│                                             │
│  TARGET TABLE                               │
│  ┌──────────────────┐                       │
│  │ expected result   │                       │
│  └──────────────────┘                       │
└─────────────────────────────────────────────┘
```

### Behavior

- Learner drags operation blocks from the palette into pipeline slots
- Slots are vertical (top = first operation, bottom = last)
- **Order validation is IMMEDIATE and VISUAL:**
  - If the learner puts GUARD (HAVING) before GROUP (GROUP BY): the GUARD block shakes and shows a red tooltip: "Can't filter groups that don't exist yet"
  - If the learner puts SELECT before FILTER: a yellow warning (not error): "This works, but filtering after selecting might lose columns you need for the filter condition"
  - If operations are in correct order: connection lines between blocks glow green
- When the pipeline is complete and valid, the learner taps "Execute Pipeline" and watches a preview animation: data flows from source through each operation block to target
- If the pipeline animation produces the wrong result, the learner can see WHERE it diverges
- **THEN** the learner writes the SQL, with the pipeline visible as reference

### Why This Is Revolutionary for Learning

In traditional SQL education, execution order is taught as a list to memorize:
```
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

In SQL Forge, the learner has BUILT this order with their hands 30+ times before they ever see it written down. When they eventually encounter the written order, their reaction is: "Oh, that's just what I've been doing." The knowledge goes IN → OUT (discovery → formalization) instead of OUT → IN (memorization → application).

---

## The Syntax Helper — Minimizing Memorization of Boilerplate

Since the app prioritizes internalization over memorization, pure syntax recall should be minimized. But SQL has irreducible syntax (you must know the keyword is `HAVING`, not `GROUPFILTER`).

**Solution: The Syntax Shelf**

A collapsible panel at the bottom of the editor shows syntax templates for all operations the learner has used. These are NOT answers — they're structural reminders:

```
FILTER ROWS:    WHERE <condition>
GROUP:          GROUP BY <column>
GUARD:          HAVING <aggregate_condition>
CONNECT:        ___ JOIN <table> ON <left.key> = <right.key>
WINDOW:         <func>() OVER (PARTITION BY <col> ORDER BY <col>)
STEP:           WITH <name> AS ( <query> )
```

**The shelf is ALWAYS available.** There's no shame in checking syntax. The learning goal is "understand what operation to use and why" — not "memorize exact keywords."

**The shelf gets SMALLER as gems brighten.** At Level 1, the full template is shown. At Level 3, only the keyword is shown (`HAVING ...`). At Level 4, nothing — the learner no longer needs it. The shelf adapts to their internalization level.

---

## The Complete Layer Curriculum

### The Database

All layers use a single, growing database about a streaming entertainment platform.

**Tables (introduced progressively):**

```sql
-- Layer 1-2
shows (id, name, genre, imdb_rating, certificate, premiere_year, finale_year, episode_count, overview)
episodes (id, show_id, season, episode, title, air_date, runtime_min, rating)

-- Layer 3
viewers (id, username, email, country, signup_date, plan)
watch_history (id, viewer_id, episode_id, watched_at, watch_pct)

-- Layer 4
reviews (id, viewer_id, show_id, rating, review_text, created_at)
subscriptions (id, viewer_id, plan, start_date, end_date, monthly_price, currency)

-- Layer 5
daily_metrics (show_id, metric_date, views, new_subs, revenue)
```

Seed meaningful sample data: 15 shows, 50+ episodes, 20 viewers, 100+ watch_history rows, etc. The schema is displayed as a visual entity-relationship diagram (boxes with lines showing foreign keys) whenever multiple tables are involved.

---

### ═══════════════════════════════════════
### LAYER 1: THE SURFACE — See and Filter
### ═══════════════════════════════════════

**Visual environment:** Warm daylight, simple rock layers. One table at a time.
**Concepts:** SELECT, FROM, WHERE, AND/OR, IN, BETWEEN, LIKE, IS NULL, ORDER BY, LIMIT, DISTINCT, COALESCE, aliases

**14 challenges + Forge Challenge. Approximate breakdown:**
- 5 TRANSFORM: Basic column selection, row filtering, sorting, limiting, distinct
- 4 OPERATION BUILDER: Building simple pipelines (FILTER → SELECT → SORT → LIMIT)
- 3 PREDICT: "Given this query, which result is correct?"
- 2 WRONG TOOL: "IS NULL vs = NULL" (learner tries = NULL, sees it fail, discovers IS NULL); "DISTINCT vs GROUP BY for simple unique lists" (DISTINCT is simpler here)

**Key moments:**

**Challenge 1.3 — First TRANSFORM (The Filter)**
Source: 15-row shows table. Target: 4 rows, all with imdb_rating > 8.5.
No instruction. The learner notices "fewer rows, all high-rated" and writes `WHERE imdb_rating > 8.5`.
Animation: 11 rows fade and fall. 4 remain.

**Challenge 1.6 — First OPERATION BUILDER**
Source: 15 rows. Target: 3 rows, 2 columns, sorted by rating desc.
The learner drags: FILTER ROWS → SELECT COLUMNS → SORT → LIMIT.
If they put SORT before SELECT, a yellow warning appears: "You can sort first, but if you're sorting by a column you haven't selected, think about whether it will still be available."
After correct pipeline: they write the SQL with the pipeline visible.

**Challenge 1.9 — The NULL Discovery (WRONG TOOL)**
Source: Shows table, some finale_year cells are visually HOLLOW (dark, dashed border).
Target: Only rows with hollow finale_year.
The learner's natural instinct: `WHERE finale_year = NULL`. The animation shows WHERE running but NOTHING matching — no rows selected. A brief explanation appears: "NULL isn't a value — it's ABSENCE. You can't use = to compare with absence. Use IS NULL to check for it."
They rewrite with IS NULL. Now the animation works.
**This is learned through FAILURE, not instruction. The learner hits the wall, sees why, and understands. They'll never write `= NULL` again.**

**Challenge 1.12 — Tie-Breaker (TRANSFORM)**
Source: Shows where two have the same rating.
Target: 1 row — the alphabetically first among tied shows.
The learner must discover `ORDER BY rating DESC, name ASC LIMIT 1`.
**This directly teaches the HackerRank tie-breaking pattern through visual puzzle-solving.**

**Challenge 1.14 — First PREDICT (Build)**
Query: `SELECT name, imdb_rating FROM shows WHERE certificate IN ('A', 'PG') ORDER BY imdb_rating DESC LIMIT 3;`
Source table shown. Empty result grid shown. The learner must: drag only `name` and `imdb_rating` column headers into the result → drag rows where certificate is 'A' or 'PG' into the result → reorder them by rating desc → remove all but the top 3. **No options to pick from. They build it themselves.**
If wrong: the actual animation plays, showing where their manual construction diverged from the real result.

**Forge Challenge 1:**
OPERATION BUILDER + TRANSFORM combined. Source: full shows table. Target: Top 5 still-running shows (finale_year IS NULL), premiered after 2010, sorted by rating desc then name asc, showing only name and imdb_rating.
The learner builds the pipeline, then writes the query, then watches the full animation.

---

### ═══════════════════════════════════════
### LAYER 2: UPPER MINE — Aggregate and Group
### ═══════════════════════════════════════

**Visual environment:** Cool underground blues, crystal veins in background.
**Concepts:** COUNT, SUM, AVG, MIN, MAX, ROUND, GROUP BY, HAVING, CASE WHEN

**15 challenges + Forge Challenge:**
- 4 TRANSFORM: Aggregation, grouping, grouped aggregation, HAVING
- 3 OPERATION BUILDER: Especially critical here — building FILTER → GROUP → GUARD → SORT pipelines
- 2 PREDICT (build): "Build the GROUP BY result by hand" — form groups, compute aggregates manually
- 2 DIAGNOSE: WHERE vs HAVING errors, alias-in-WHERE errors
- 1 WRONG TOOL: GROUP BY when DISTINCT would suffice / DISTINCT when GROUP BY is needed
- 1 MANY ROADS: Multiple ways to count (COUNT(*) vs COUNT(column) vs SUM(CASE WHEN))
- 1 TEACH-BACK: First teach-back challenge (see below)
- 1 Additional PREDICT (build): Computing SUM and AVG by hand

**Key moments:**

**Challenge 2.5 — The GROUP BY "Aha" (OPERATION BUILDER first, then TRANSFORM)**
Part A (OPERATION BUILDER): Source has 15 rows. Target has 4 rows with counts. Available blocks include FILTER and GROUP & COMPUTE. The learner must choose GROUP & COMPUTE (not FILTER — filtering removes rows, grouping MERGES them into fewer rows with computed values). If they try FILTER, the preview shows rows disappearing but no counts appearing. They switch to GROUP.

Part B (TRANSFORM): Now write the SQL. They've already built the pipeline, so they know they need GROUP BY. The syntax shelf shows `GROUP BY <column>`.

**The crucial animation:** Rows with matching certificate values get the same color highlight. They slide together. Multiple rows compress into one. A burst shows "5 rows → COUNT = 5." **The learner WATCHES aggregation happen. This visual is the definition of GROUP BY — they'll never confuse it with anything else.**

**Challenge 2.8 — WHERE vs HAVING (DIAGNOSE)**
```sql
SELECT certificate, COUNT(*) AS cnt
FROM shows
WHERE cnt > 3
GROUP BY certificate;
```
This errors. The animation shows WHERE firing BEFORE GROUP BY. WHERE reaches for `cnt` but it doesn't exist yet (ghostly, floating missing reference). The learner selects from diagnostic options:
- A) "WHERE runs before GROUP BY, so the alias cnt doesn't exist yet"
- B) "WHERE filters individual rows, not groups — HAVING filters groups"
- C) "Both A and B describe the same underlying issue — execution order"
Correct: C. **The learner articulates WHY, not just "change WHERE to HAVING."**

**Challenge 2.11 — PREDICT (Build Variant)**
Query shown: `SELECT certificate, ROUND(AVG(imdb_rating), 1) FROM shows GROUP BY certificate`
Source table shown. The learner must MANUALLY BUILD the result: drag certificates into groups, calculate the average for each group themselves (mentally computing 8.2 + 7.5 + 9.1 / 3 = 8.27 → rounds to 8.3). **This forces actual computation, not just recognizing patterns. The learner knows what AVG DOES because they computed it by hand.**

**Challenge 2.13 — MANY ROADS (Conditional Counting)**
Three queries that count shows per certificate, but different approaches:
```sql
-- A: Simple GROUP BY
SELECT certificate, COUNT(*) FROM shows GROUP BY certificate;

-- B: Conditional with CASE
SELECT
  SUM(CASE WHEN certificate = 'A' THEN 1 ELSE 0 END) AS a_count,
  SUM(CASE WHEN certificate = 'PG' THEN 1 ELSE 0 END) AS pg_count
FROM shows;

-- C: FILTER clause
SELECT
  COUNT(*) FILTER (WHERE certificate = 'A') AS a_count,
  COUNT(*) FILTER (WHERE certificate = 'PG') AS pg_count
FROM shows;
```
Same data, different output shapes. A produces rows. B/C produce columns. The learner sees when each approach is appropriate (A for unknown number of groups, B/C for known fixed groups you want as columns). **This teaches flexibility, not "there's one right way."**

**Challenge 2.14 — First TEACH-BACK**
Two animations play side by side: a WHERE animation (individual rows dropping) and a HAVING animation (entire group rows dropping).
Prompt: "A teammate writes `WHERE COUNT(*) > 3` and gets an error. They ask you why. Explain in 1-2 sentences what's wrong and what they should use instead."
The learner types their explanation. The API validates for key concepts: (1) WHERE runs before grouping, so aggregate functions aren't available yet, (2) HAVING is designed for filtering groups/aggregates.
**This is the first time the learner must put a concept into their own words. If they can explain WHERE vs HAVING clearly, they own it permanently.**

---

### ═══════════════════════════════════════
### LAYER 3: THE CROSSROADS — Joining Tables
### ═══════════════════════════════════════

**Visual environment:** Two-tone cavern where tunnels meet. Two+ tables visible.
**Concepts:** INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, self-join, multi-table joins, COUNT DISTINCT, LEFT JOIN + IS NULL pattern

**18 challenges + Forge Challenge:**
- 4 TRANSFORM: Basic join, multi-table join, join + aggregate, self-join
- 3 OPERATION BUILDER: Adding CONNECT blocks to pipelines, ordering CONNECT before GROUP
- 2 PREDICT (build): "Which rows survive this JOIN?" (learner drags matching rows together, connects them manually)
- 2 WRONG TOOL: INNER JOIN when LEFT JOIN is needed; JOIN when a subquery would be cleaner
- 2 MANY ROADS: LEFT JOIN + IS NULL vs NOT EXISTS vs NOT IN for "items without matches"
- 1 DIAGNOSE: Wrong join type dropping rows
- 1 TEACH-BACK: Explain INNER vs LEFT JOIN to a teammate
- 2 FADED TARGET: First faded-target challenges (labeled fade — column headers visible, values hidden)
- 1 REAL WORLD: First schema-only question

**Key moments:**

**Challenge 3.1 — First JOIN (OPERATION BUILDER first)**
Source: `shows` and `episodes` tables side by side with a visible foreign key arrow (episodes.show_id → shows.id).
Target: A wider table with columns from both.
OPERATION BUILDER: The learner must choose CONNECT TABLES. The pipeline asks them to specify which tables and which key. **This forces them to think about the relationship before writing syntax.**
TRANSFORM: Then write the SQL.
**Animation:** The two tables slide toward each other. Lines draw between matching rows. Connected rows merge horizontally. **The learner SEES joining as "connecting tables on matching keys."**

**Challenge 3.4 — The Orphan Problem (WRONG TOOL)**
Source: `shows` + `episodes`. Some shows have NO episodes.
Target: All shows with episode count — INCLUDING shows with 0 episodes.
The learner tries INNER JOIN (natural instinct). The animation shows 3 shows disappearing. Their result is missing rows vs the target. "Why did those shows vanish?"
The app highlights the missing shows: "These shows had no matching episodes. INNER JOIN drops unmatched rows. LEFT JOIN keeps all rows from the left table."
They switch to LEFT JOIN. The animation shows unmatched shows staying, with dark NULL cells on the right. COUNT gives 0 for those shows.
**This failure-driven discovery is stickier than being told "use LEFT JOIN when you want to keep unmatched rows."**

**Challenge 3.8 — "Find the Ghosts" (MANY ROADS)**
Goal: Find shows with zero reviews.
Three approaches animated:
1. LEFT JOIN + IS NULL: tables join, unmatched rows get NULLs, WHERE keeps NULLs
2. NOT EXISTS: for each show, spotlight searches reviews — no match found, show stays
3. NOT IN: subquery produces review show_ids, those IDs block matching shows

The learner watches all three, then answers: "If the reviews table could have NULL show_id values, which approach would give wrong results?" (NOT IN — because `NOT IN (list containing NULL)` returns no rows. The animation can show this: a NULL in the blocking list causes everything to be blocked.)
**This teaches a subtle, important gotcha through visual demonstration.**

**Challenge 3.11 — TEACH-BACK (INNER vs LEFT JOIN)**
Two animations play: INNER JOIN (unmatched rows fade from both sides) and LEFT JOIN (unmatched left rows stay with NULL right-side).
Prompt: "A data analyst says 'I keep getting fewer results than expected from my JOIN.' What question would you ask them, and what's the likely fix?"
Expected concepts: (1) Are there unmatched rows in the left table? (2) INNER JOIN drops unmatched rows. (3) Switch to LEFT JOIN to keep all left-side rows.
**The "what question would you ask" framing tests deeper understanding — it's not just knowing the answer but knowing how to diagnose.**

**Challenge 3.13 — First FADED TARGET (Labeled Fade)**
Source: `shows` + `episodes` tables (full data visible).
Faded target: Column headers visible ("show_name", "episode_count"), row count visible (12 rows). But all cell values are dim placeholders.
Task description: "Find how many episodes each show has."
The learner can see the target SHAPE (2 columns, 12 rows) and column names, but must figure out the actual query (JOIN + GROUP BY + COUNT). The shape tells them "I need 2 columns and 12 groups" — but the values are up to them.
**This is the first time the learner works without seeing exact expected values. They must trust their understanding of JOINs and GROUP BY, not just match a visual target.**

**Challenge 3.15 — Second FADED TARGET (Labeled Fade)**
Source: `shows` + `watch_history` + `viewers` + `episodes`
Faded target: Column headers ("country", "unique_viewers", "avg_watch_pct"), 8 rows, sorted arrow on "unique_viewers" descending.
Task description: "Find viewership stats by country."
The learner sees the shape and column names but computes the values themselves. This requires a 3-table JOIN + GROUP BY + COUNT DISTINCT + AVG — a significant step up.

**Challenge 3.18 — First REAL WORLD**
Schema ER diagram shown (all tables with relationships). No source data. No target.
Question: "The product team asks: which 3 countries have the most premium subscribers?"
The learner must: identify tables (viewers + subscriptions), plan joins, add filter (plan = 'premium'), group by country, count, sort, limit. No visual scaffolding beyond the schema.
**This is the bridge to real work.**

---

### ═══════════════════════════════════════
### LAYER 4: DEEP SHAFTS — Subqueries and Sets
### ═══════════════════════════════════════

**Visual environment:** Darker cavern, amber lantern glow.
**Concepts:** Scalar subqueries, IN/NOT IN, EXISTS/NOT EXISTS, correlated subqueries, derived tables, UNION/UNION ALL, INTERSECT, EXCEPT

**14 challenges + Forge Challenge:**
- 3 TRANSFORM: Subquery in WHERE, derived table, set operations
- 2 OPERATION BUILDER: Adding INNER QUERY and INTERMEDIATE STEP blocks
- 2 PREDICT: "What does this correlated subquery return for each row?"
- 2 WRONG TOOL: Subquery when JOIN is simpler; JOIN when subquery is clearer; UNION when UNION ALL is correct (or vice versa)
- 2 MANY ROADS: Multiple subquery approaches for the same problem
- 2 DIAGNOSE: Correlated vs non-correlated subquery errors
- 1 REAL WORLD

**Key moments:**

**Challenge 4.1 — "Above Average" (OPERATION BUILDER → TRANSFORM)**
Source: Shows table. Target: Shows with rating above average.
OPERATION BUILDER: The learner must realize they need TWO operations: first COMPUTE the average (INNER QUERY), then FILTER using that computed value. If they try just FILTER, they can't specify "above average" because the average isn't a fixed number.
**The pipeline makes the two-step nature of subqueries tangible: "I need to compute something first, then use that result."**

**Challenge 4.5 — EXISTS vs IN (PREDICT with animation comparison)**
Two queries, same goal. The PREDICT asks which produces the same result. Then both animate:
- IN: subquery runs once, produces a list, outer query checks the list
- EXISTS: for each outer row, subquery runs (spotlight animation), stops at first match
**The learner SEES the performance difference: IN does one big lookup; EXISTS does many small lookups but stops early. This is internalized through visual contrast, not a performance tuning lecture.**

---

### ═══════════════════════════════════════
### LAYER 5: THE CORE — Windows, CTEs, Mastery
### ═══════════════════════════════════════

**Visual environment:** Deep red/orange magma glow, crystal formations.
**Concepts:** RANK, DENSE_RANK, ROW_NUMBER, LAG, LEAD, SUM/AVG OVER, NTILE, PERCENT_RANK, frame clauses, CTEs (single, multiple, recursive), EXTRACT, date arithmetic, string functions, and all HackerRank assessment patterns

**20 challenges + 5 Master Trials:**
- 4 TRANSFORM: Window functions, CTEs, date grouping, string manipulation
- 2 OPERATION BUILDER: Building CTE pipelines, deciding window vs group
- 2 PREDICT: "Does this window function collapse rows?" / "What value does LAG produce here?"
- 3 WRONG TOOL: GROUP BY vs window function (the critical distinction); WHERE on window function (must wrap in CTE); HAVING on window result
- 2 MANY ROADS: Self-join vs LAG for row comparison; multiple CTE structures
- 3 DIAGNOSE: Window function in WHERE (can't do it), wrong PARTITION BY, recursive CTE infinite loop
- 4 REAL WORLD: Full business questions with schema only

**Key moments:**

**Challenge 5.1 — Window vs Group (WRONG TOOL — the most important challenge in the app)**
Source: Shows table with ratings.
Target: Same rows as source (same count!), PLUS a new column showing each show's rank.

The learner's instinct: GROUP BY something, add RANK somehow. They try. The animation collapses rows. The result has fewer rows than the target. **Visible failure: "I lost data."**

The app explains: "GROUP BY collapses rows. You need every row to survive but gain new information. This is what window functions do."

They write `RANK() OVER (ORDER BY imdb_rating DESC)`. The animation: a translucent window frame appears over all rows. Rank numbers float in from the side, attaching to each row. **The rows don't move. They don't merge. They stay, and new data appears next to them.**

**This visual contrast — GROUP BY compresses, window functions enrich — is the single most important conceptual "aha" in the entire curriculum. Once seen, never confused.**

**Challenge 5.4 — LAG/LEAD (TRANSFORM)**
Source: daily_metrics (dates and views).
Target: Same rows, with an added column showing previous day's views.
Visual hint: Each target row has its own value AND the value from the row above it.
Animation: For each row, a translucent arrow reaches UP to the previous row, copies its value, and places it in the new column.
**This is the "Stock Price Comparison" HackerRank pattern. The learner solves it visually.**

**Challenge 5.7 — Top N Per Group (OPERATION BUILDER → TRANSFORM)**
Source: Episodes with ratings. Target: ONE best episode per show.
OPERATION BUILDER: The learner must build a TWO-STAGE pipeline:
1. WINDOW COMPUTE (ROW_NUMBER partitioned by show, ordered by rating)
2. FILTER ROWS (where row_number = 1)

If they try just FILTER, they can't express "best per show" without the window function. If they try GROUP BY, they lose the episode details. The pipeline forces them to discover the two-step pattern.
**Then they write the SQL: CTE with ROW_NUMBER, outer SELECT with WHERE rn = 1. The pipeline they built IS the CTE structure.**

**Challenge 5.10 — CTE Pipeline (OPERATION BUILDER for CTE design)**
A complex problem requiring multiple intermediate computations.
The OPERATION BUILDER has INTERMEDIATE STEP blocks that the learner names and defines. Each step is a CTE.
**The learner designs the pipeline FIRST (which CTEs, in which order, feeding what data), then translates to SQL. The CTE structure mirrors their pipeline exactly.**

**Challenges 5.16–5.20 — "The Master's Trials" (REAL WORLD)**
Five full problems. Schema ER diagram only. Plain English question. No visual scaffolding.

**Trial 1: "Customer Information with Country Codes"**
"Show each active subscriber's username, email, country, plan, and country code (first 2 characters of country, uppercased). Sort by country, then username."

**Trial 2: "Products Without Sales"**
"Find all shows no one has ever watched (zero entries in watch_history for any episode). Show name and premiere year, sorted alphabetically."

**Trial 3: "Quarterly Revenue Report"**
"For each quarter of 2025, show total revenue, total views, and average daily revenue. Format as 'Q1-2025'. Include quarters with no data as zeros. Sort chronologically."

**Trial 4: "Top Reviewer Per Show"**
"For each show with reviews, find the reviewer who wrote the most reviews. Break ties by higher average rating. Show show name, username, review count, average rating (1 decimal)."

**Trial 5: "Viewer Retention Analysis"**
"For each signup month, show total signups, how many watched at least one episode within 30 days ('activated'), and activation rate as a percentage (1 decimal). Sort by month."

**These are the exact HackerRank certification patterns. By this point, the learner has internalized every concept through visual puzzles, operation building, failure-driven discovery, and multi-approach exposure. The trials are just applying what they already understand.**

---

## UI/UX Specification

### Aesthetic Direction
**Industrial-organic underground mine.** Not cartoony, not corporate. Think: geological cross-section meets data visualization. Clean, dark, warm accents.

- **Background:** Deep charcoal with subtle stone texture via CSS (layered radial gradients + pseudo-element noise). Darkens progressively per layer.
- **Tables:** Mineral-vein aesthetic — rows are horizontal bands with warm stone tints (alternating slightly). Column headers set in darker rock above. Subtle depth with box-shadow.
- **Accent colors:** Amber/gold for correct (forge glow), deep ruby for errors, cyan for connections/joins. Each gem has its own color from the table above.
- **Typography:** "IBM Plex Mono" for SQL code (from Google Fonts), "Outfit" for UI text. SQL keywords rendered in cyan, strings in green, numbers in amber within the editor.
- **Animations:** All CSS transitions/keyframes + minimal inline SVG for connection lines. transform (translate, scale, opacity) for data movements. 300-600ms durations. ease-out for falling/fading, ease-in-out for sliding. No JS animation libraries.

### Layout

**Desktop:**
```
┌──────────────────────────────────────────────────────────────────┐
│ [Gem Belt — scrollable horizontal bar of concept gems]           │
├───────────┬──────────────────────────────────────────────────────┤
│           │  ┌─── SOURCE ────┐        ┌─── TARGET ────┐        │
│  LAYER    │  │               │  ────► │               │        │
│  MAP      │  │  visual data  │        │  visual data  │        │
│           │  │  grid         │        │  grid (gold   │        │
│  (vertical│  │               │        │   outline)    │        │
│  depth    │  └───────────────┘        └───────────────┘        │
│  indicator│                                                     │
│  showing  │  ┌─── OPERATION BUILDER (when active) ────────┐    │
│  all 5    │  │  drag blocks into pipeline slots           │    │
│  layers,  │  └────────────────────────────────────────────┘    │
│  current  │                                                     │
│  position,│  ┌─── SQL EDITOR ────────────────────────────┐     │
│  and gem  │  │  > _                                      │     │
│  summary) │  │                     [Syntax Shelf ▼]      │     │
│           │  └────────────────────────────────────────────┘     │
│           │                                                     │
│           │  ┌─── RESULT / ANIMATION AREA ───────────────┐     │
│           │  │  (correct: animation plays here)          │     │
│           │  │  (wrong: your result vs target comparison)│     │
│           │  └────────────────────────────────────────────┘     │
│           │                                                     │
│           │  ┌─── WHY / DIAGNOSIS PANEL ─────────────────┐     │
│           │  │  (appears after answer with explanation)   │     │
│           │  └────────────────────────────────────────────┘     │
├───────────┴──────────────────────────────────────────────────────┤
│  [Challenge Type Badge: TRANSFORM | OP BUILDER | PREDICT | etc] │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile:**
- Gem belt at top (horizontally scrollable)
- Source/target tables stack vertically, swipeable
- Operation Builder is a bottom sheet that slides up
- SQL editor below tables
- Layer map is a collapsible left drawer
- WHY panel slides up from bottom

### Editor Details
- SQL syntax highlighting
- Auto-indent on newlines
- Ctrl+Enter / Cmd+Enter to submit
- **No placeholder text** — the visual puzzle IS the hint
- Line numbers
- Syntax Shelf collapsible at bottom of editor (shrinks as gems brighten)
- On correct: editor border glows amber, 400ms
- On wrong: editor shakes subtly (translateX oscillation), 300ms

### Challenge Type Visual Indicators
Each challenge type has a small badge/label so the learner knows what's expected:
- TRANSFORM: ⚒️ "Forge the Query"
- OPERATION BUILDER: 🔧 "Build the Pipeline"
- PREDICT: 🔮 "Predict the Result"
- WRONG TOOL: ⚡ "Find the Right Tool"
- MANY ROADS: 🔀 "Explore Alternatives"
- DIAGNOSE: 🩺 "Diagnose the Bug"
- TEACH-BACK: 🎓 "Explain It"
- FADED TARGET: 🌫️ "Trust Your Instinct"
- REAL WORLD: 🗺️ "Real World Challenge"

---

## Persistent Storage (window.storage)

Single key `sql-forge-state`:

```json
{
  "currentLayer": 2,
  "currentChallenge": "2.5",
  "gems": {
    "filter": { "level": 3, "lastUsed": "2026-05-25T14:30:00Z" },
    "sort": { "level": 2, "lastUsed": "2026-05-22T10:00:00Z" },
    "group": { "level": 1, "lastUsed": "2026-05-26T09:00:00Z" },
    "compass": { "level": 2, "lastUsed": "2026-05-24T16:00:00Z" },
    "teacher": { "level": 1, "lastUsed": "2026-05-25T11:00:00Z" },
    "pathfinder": { "level": 0, "lastUsed": null }
  },
  "completedChallenges": ["1.1", "1.2", "1.3"],
  "queryLog": {
    "1.3": { "query": "SELECT name, imdb_rating FROM shows WHERE imdb_rating > 8.5;", "attempts": 2 }
  },
  "pipelineHistory": {
    "1.6": ["FILTER_ROWS", "SELECT_COLUMNS", "SORT", "LIMIT"]
  },
  "predictBuilds": {
    "1.14": { "correct": true, "attempts": 1, "manualValues": { "avg_computed": "8.2" } }
  },
  "teachBackHistory": {
    "2.14": { "explanation": "WHERE runs before GROUP BY so aggregates don't exist yet. Use HAVING to filter groups.", "passed": true, "missingConcepts": [] }
  },
  "diagnosticAnswers": {
    "2.8": { "chosen": "C", "correct": true }
  },
  "fadedTargetScaffoldLevel": "labeled_fade",
  "streakDays": 4,
  "lastActiveDate": "2026-05-26",
  "forgesCompleted": [1],
  "syntaxShelfLevel": {
    "filter": "keyword_only",
    "group": "full_template"
  }
}
```

---

## Minimum Seed Content

For immediate usability, fully seed:

- **Layer 1:** All 14 challenges + Forge Challenge
  - Complete source/target data for each
  - All animations specified
  - All Operation Builder configurations
  - All PREDICT build interfaces (drag targets, empty result grids)
  - All WRONG TOOL failure paths
  - WHY explanations for each
- **Layer 2:** Challenges 2.1–2.14 (through the first TEACH-BACK)
  - The GROUP BY animation is the visual centerpiece — this must be polished
  - The TEACH-BACK validation must use Claude API for semantic checking
  - PREDICT build challenges must support manual aggregate computation (learner types values)
- **Layer 3:** Challenges 3.1–3.13 (through the first FADED TARGET)
  - The JOIN animation (tables sliding together, lines connecting) must be polished
  - FADED TARGET rendering: column headers visible, row outlines visible, cell values as dim placeholders
  - TEACH-BACK validation for JOIN concepts
- **Layer 5:** Challenge 5.1 only (the window vs GROUP BY WRONG TOOL)
  - This can be shown as a "preview" of what's coming — it's the app's most powerful teaching moment
- Full sample data for `shows` (15 rows) and `episodes` (40+ rows)
- All 19 gem types defined with colors/shapes (including Teacher and Pathfinder)
- Syntax Shelf with templates for all Layer 1-2 concepts
- Gem dimming logic active from start
- Scaffolding fade system implemented (full → labeled → shape-only → row-count → none)

Later layers show a locked mine shaft: "This vein runs deeper — keep mining."

---

## Internalization Audit

Here's where each SQL concept falls on the internalization spectrum:

**Fully internalized through visual/conceptual/articulatory learning (no memorization needed):**
- WHERE vs HAVING (visual: same animation, different stage — WRONG TOOL + DIAGNOSE + TEACH-BACK: learner explains the difference to a "teammate")
- GROUP BY vs window functions (visual: rows merge vs rows stay — WRONG TOOL + TEACH-BACK)
- INNER JOIN vs LEFT JOIN (visual: unmatched rows fade vs stay — WRONG TOOL + TEACH-BACK + FADED TARGET)
- Execution order (built by hand via Operation Builder 30+ times + DIAGNOSE explaining order violations)
- NULL as absence (visual: hollow cells, = NULL fails visually — WRONG TOOL + TEACH-BACK)
- Subquery execution order (visual: mini-table resolves first, feeds into outer — Operation Builder + PREDICT builds)
- CTE pipeline structure (visual: intermediate tables with arrows — Operation Builder + FADED TARGET)
- When to aggregate vs when to window (visual contrast + TEACH-BACK articulation of the difference)
- "Items without matches" pattern (MANY ROADS: three approaches + TEACH-BACK: explain when to use each)
- Running totals/moving averages (visual: expanding bracket, sliding window + PREDICT: compute running total by hand)
- LAG/LEAD (visual: arrow reaching to adjacent row + PREDICT: compute LAG values by hand)
- Aggregate mechanics (PREDICT build: learner manually computes COUNT/AVG/SUM for small groups — they know what the database DOES because they did it themselves)
- Problem decomposition (Operation Builder → FADED TARGET → REAL WORLD: progressive scaffolding removal builds self-sufficiency)

**Partially internalized — concept deep, syntax surface:**
- Specific aggregate functions — concept of "collapse rows into value" is fully internalized through PREDICT builds (computing AVG by hand), but `AVG()` vs `MEAN()` is a function name
- JOIN ON clause — concept of "connect tables on matching keys" is visual + articulable, but exact syntax `ON a.id = b.a_id` needs the shelf initially
- Window function OVER clause — concept is visual + teachable, but `OVER (PARTITION BY x ORDER BY y)` syntax needs shelf initially
- CTE WITH syntax — pipeline concept is internalized through Operation Builder, but `WITH name AS (...)` is boilerplate

**Irreducibly syntax-based (Syntax Shelf handles these — ~10% of total learning):**
- Specific function names: COALESCE, EXTRACT, SPLIT_PART, SUBSTRING, CONCAT
- BETWEEN, LIKE wildcards (%), IN list syntax
- CASE WHEN ... THEN ... ELSE ... END structure
- UNION vs UNION ALL keywords
- DENSE_RANK vs RANK vs ROW_NUMBER names
- RECURSIVE keyword for recursive CTEs
- CAST / :: type conversion syntax

**Total internalization breakdown: ~90% intuition/conceptual/articulatory, ~10% syntax recall.**

The three additions that pushed from 85% to 90%:
1. **PREDICT builds (no multiple choice)** moved aggregates from "partially internalized" to "fully internalized" — computing AVG(7.2, 8.4, 9.0) = 8.2 by hand means you KNOW what AVG does, not just its name
2. **TEACH-BACK** moved WHERE vs HAVING, INNER vs LEFT JOIN, and GROUP BY vs window functions from "understood" to "owned" — if you can explain it in your own words, you can't lose it
3. **FADED TARGET scaffolding ramp** moved problem decomposition from "requires visual scaffolding" to "self-sufficient" — the gradual removal of the target means the learner barely notices they're working without it

---

## The Promise

After completing all 5 layers, the learner will:

- **SEE** SQL operations in their mind — they'll visualize rows filtering, tables joining, groups merging, windows sliding — because they watched these animations hundreds of times
- **PLAN** queries by building mental operation pipelines — they'll think "I need to connect these tables, then group, then filter the groups, then sort" BEFORE thinking about syntax — because they built these pipelines with their hands
- **COMPUTE** mentally what a query will produce — they can look at a GROUP BY + AVG query and know the result because they've hand-calculated averages, hand-formed groups, hand-sorted rows in PREDICT builds dozens of times
- **CHOOSE** between approaches — they won't just know LEFT JOIN + IS NULL; they'll know three ways to find missing items and when each is best — because they've seen all three animate and compared tradeoffs
- **DIAGNOSE** their own mistakes — they'll know WHY something is wrong, not just that it is — because they've practiced explaining failures conceptually
- **TEACH** concepts to others — they can explain WHERE vs HAVING, INNER vs LEFT JOIN, GROUP BY vs window functions in plain English — because TEACH-BACK challenges forced them to crystallize their understanding into words
- **TRANSLATE** business questions into SQL without scaffolding — because FADED TARGET challenges gradually removed the visual crutch until they didn't need it, and REAL WORLD challenges stripped away everything but the question and the schema
- **RETAIN** everything — because gem dimming ensures concepts stay exercised, because visual/kinesthetic memory is more durable than textual memory, and because articulated understanding (TEACH-BACK) is the most durable form of knowledge

They won't just know SQL. They'll think in it.
