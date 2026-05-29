# SQL Forge — Project Instructions

## What This Project Is
An interactive, gamified SQL learning app built as a single React JSX artifact.
Full design doc: @docs/design.md

## Tech Stack
- Single React JSX file (for Claude.ai artifact rendering)
- Tailwind CSS (core utility classes only — no compiler)
- CSS animations/transitions only (no animation libraries)
- No localStorage — use useState/useReducer for session state
- window.storage API for persistence across sessions (see design doc for API)
- Claude API (api.anthropic.com/v1/messages) for TEACH-BACK semantic validation

## IMPORTANT Rules
- NEVER use localStorage or sessionStorage — artifacts fail in Claude.ai with these
- NEVER use external animation libraries (framer-motion, react-spring, etc.)
- NEVER split into multiple files — everything must be ONE .jsx file
- ALWAYS use default exports for the React component
- ALWAYS use Tailwind core utility classes (pre-defined only, no custom compiler classes)
- ALL state management through useState/useReducer hooks
- For imports: only use libraries available in Claude.ai artifacts (react, recharts, lodash, d3, papaparse, lucide-react, shadcn/ui)
- CSS variables for theming (dark mine aesthetic)
- Keep the component under 15,000 lines — if approaching this, simplify

## Available Libraries (import syntax)
- `import { useState, useReducer, useEffect, useRef } from "react"`
- `import { ChevronRight, Lock, Check, X, ... } from "lucide-react"`
- `import _ from 'lodash'`

## Code Style
- Functional components with hooks only
- Use useReducer for complex state (game state, gems, challenges)
- Extract sub-components within the same file (not separate files)
- Use CSS template literals or Tailwind for styling — no CSS modules
- Descriptive variable names, comments for complex logic

## Architecture Decisions
- Game state is a single useReducer with actions like SUBMIT_ANSWER, NEXT_CHALLENGE, UPDATE_GEM, etc.
- Challenge data is defined as a static array/object at the top of the file
- SQL validation is done client-side by comparing normalized query strings
- Animations use CSS transitions triggered by state changes (className toggling)
- The Operation Builder uses drag-and-drop via native HTML5 drag API (onDragStart, onDrop, onDragOver)

## Build Phases
We are building this app incrementally. Each phase adds one feature layer.
Current phase: Phase 8: TEACH-BACK + Claude API integration
- Phase 1: Core shell + Layer 1 TRANSFORM challenges ✓
- Phase 2: Animation system ✓
- Phase 3: Operation Builder ✓
- Phase 4: PREDICT build challenges ✓
- Phase 5: WRONG TOOL + DIAGNOSE challenges ✓
- Phase 6: Gem system + Syntax Shelf ✓
- Phase 7: Layer 2 (GROUP BY + aggregates) ✓
- Phase 8: TEACH-BACK + Claude API integration
- Phase 9: Layer 3 (JOINs) + FADED TARGET
- Phase 10: Layer 4-5 + MANY ROADS + REAL WORLD
