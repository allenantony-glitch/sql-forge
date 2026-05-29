# SQL Forge — Project Instructions

## What This Project Is
An interactive, gamified SQL learning app. Vite + React, deployed on Vercel.
Full design doc: docs/design.md

## Tech Stack
- Vite + React 18
- Tailwind CSS v3 (PostCSS)
- CSS animations/transitions only (no framer-motion, react-spring, etc.)
- localStorage for persistence
- Google Fonts: IBM Plex Mono, Outfit (loaded via index.html link tags)
- lucide-react for icons
- Deployed on Vercel (zero-config — just connect GitHub repo)

## Project Structure
```
sql-forge/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── vercel.json                  — SPA fallback for client-side routing
├── CLAUDE.md
├── docs/
│   └── design.md               — Full design specification
├── public/
│   └── (static assets if any)
└── src/
    ├── main.jsx                 — React entry point (createRoot)
    ├── App.jsx                  — Root component, state management, challenge routing
    ├── index.css                — Tailwind directives + global CSS keyframes
    │
    ├── data/
    │   ├── shows.js             — SHOWS_DATA, EPISODES_DATA, REVIEWS_DATA, TABLES, column orders
    │   ├── challenges.js        — All challenge definitions (layers 1-3+)
    │   ├── layers.js            — LAYERS array
    │   ├── gems.js              — GEMS, GEM_BY_ID, GEM_LEVEL_*, SYNTAX_TEMPLATES, nextGemLevel()
    │   └── operations.js        — OPERATIONS, pipeline validation, canonical rank
    │
    ├── engine/
    │   ├── tokenizer.js         — tokenize()
    │   ├── parser.js            — parseQuery() + all parsing helpers
    │   ├── executor.js          — executeQuery(), evalExpr(), buildJoinedRows(), etc.
    │   ├── comparator.js        — compareResults(), diagnosePredict(), validateExplanation()
    │   └── index.js             — Re-exports: export { executeQuery } from './executor' etc.
    │
    ├── components/
    │   ├── GemBelt.jsx          — Gem belt + GemBadge + GemShape SVGs
    │   ├── LayerMap.jsx         — Sidebar layer/challenge navigation
    │   ├── DataTable.jsx        — Reusable data table (with optional row clicking for predict)
    │   ├── FadedTarget.jsx      — Scaffolded target display (labeled/shape/rowcount/none)
    │   ├── SqlEditor.jsx        — SQL editor with syntax highlighting
    │   ├── SyntaxShelf.jsx      — Collapsible syntax reference (adapts to gem brightness)
    │   ├── AnimationStage.jsx   — All animation logic (WHERE, SELECT, ORDER BY, GROUP BY, JOIN, etc.)
    │   ├── WhyPanel.jsx         — Success panel after correct answer
    │   ├── ResultComparison.jsx — Wrong answer side-by-side comparison
    │   └── challenges/
    │       ├── OperationBuilder.jsx  — PaletteBlock, PipelineSlot, PipelineBuilder, PipelineReference
    │       ├── PredictChallenge.jsx  — PredictQueryCard, ResultBuilder
    │       ├── WrongToolHint.jsx     — Hint panel for wrong-tool challenges
    │       ├── DiagnoseChallenge.jsx — DiagnoseOption + DiagnoseChallenge
    │       └── TeachBackChallenge.jsx — Teach-back with client-side validation
    │
    ├── hooks/
    │   └── usePersistedState.js — localStorage save/load with error handling
    │
    └── utils/
        ├── highlight.js         — SQL syntax highlighting tokenizer (tokenizeForHighlight)
        └── formatCell.js        — formatCell(), isNumericColumn()
```

## Code Rules
- Functional components with hooks only
- useReducer or useState for state — no external state libraries
- Each file exports named exports (except App.jsx which can use default)
- Components receive data/callbacks via props — no prop drilling beyond 2 levels (use context if needed)
- CSS: Tailwind utility classes. Global keyframes in index.css. No CSS modules.
- Animations: CSS transitions triggered by state/className changes
- The Operation Builder uses a module-level variable for drag state (sandboxed iframe fallback)
- All localStorage calls wrapped in try-catch

## Import Conventions
- React: `import { useState, useEffect } from 'react'`
- Icons: `import { Check, X, ChevronRight } from 'lucide-react'`
- Engine: `import { executeQuery, compareResults } from '../engine'`
- Data: `import { CHALLENGES } from '../data/challenges'`
- Components: `import { DataTable } from '../components/DataTable'`

## Vercel Deployment
- vercel.json has SPA rewrite: all routes → /index.html
- No server-side rendering — pure client-side React
- Build command: `npm run build` (Vite default)
- Output directory: `dist`

## Build Phases
Current phase: Phase 12

Completed:
- Phase 1: Core shell + Layer 1 TRANSFORM challenges ✓
- Phase 2: Animation system ✓
- Phase 3: Operation Builder ✓
- Phase 4: PREDICT build challenges ✓
- Phase 5: WRONG TOOL + DIAGNOSE challenges ✓
- Phase 6: Gem system + Syntax Shelf ✓
- Phase 7: Layer 2 (GROUP BY + aggregates) ✓
- Phase 8: TEACH-BACK (client-side validation) ✓
- Phase 9A: Layer 3 SQL engine + JOIN challenges ✓
- Phase 9B: JOIN animations + FADED TARGET ✓
- Phase 10: Restructure to Vite + React, deploy on Vercel ✓
- Phase 11: MANY ROADS challenge type (2 challenges in Layer 3) ✓

Remaining:
- Phase 12: REAL WORLD challenge type + ER diagram component (2 challenges in Layer 3)
- Phase 13: Layer 4 SQL engine — subqueries in WHERE/FROM/SELECT, EXISTS, NOT IN/NOT EXISTS
- Phase 14: Layer 4 challenges (6-8 challenges) + UNION/INTERSECT/EXCEPT engine support
- Phase 15: Layer 5 SQL engine — window functions (RANK, DENSE_RANK, ROW_NUMBER, LAG, LEAD, PARTITION BY, frame clauses)
- Phase 16: Layer 5 SQL engine — CTEs (WITH...AS, multiple CTEs, recursive) + string/date functions (EXTRACT, UPPER, SUBSTRING, CONCAT)
- Phase 17: Layer 5 challenges (8-10 challenges) + Master Trials (5 HackerRank-style problems)
- Phase 18: Polish — mobile responsiveness, gem dimming timer, daily challenge, edge cases, performance
