# ALLURE Study — Production Scaffold

A Next.js 14 (App Router) + Supabase + OpenAI scaffold for the AI academic companion
described in the ALLURE Study brief. This is a real, runnable architecture — not a
mockup — built around the **Memory Graph** as the core differentiator, with the
Morning Briefing and Teach Mode built on top of it as the first two working AI surfaces.

## Why this structure

The brief describes a huge surface area (voice, room mode, wearables, gamification,
exam prediction, adaptive difficulty...). Rather than stub all of it shallowly, this
scaffold builds the three things everything else depends on, end-to-end and working:

1. **The Memory Graph** (`supabase/schema.sql`, `src/lib/ai/memory-engine.ts`) —
   nodes (weak topics, preferences, routines, goals, mistake patterns...) with
   confidence scores that strengthen with repeated evidence, semantic
   de-duplication via embeddings, and a `match_memory_nodes` RPC for recall.
2. **Morning Briefing** (`/api/ai/briefing`) — reads the memory graph plus real
   assignments/exams, and asks the model to generate a structured, personalized
   briefing. Cached once per day per user; a cron route pre-generates for everyone.
3. **Teach Mode** (`/api/ai/teach`, `TeachChatPanel.tsx`) — a Socratic tutoring loop
   grounded in the same memory graph, scoped per subject. Every exchange feeds
   memory extraction back into the graph asynchronously.

Everything else in the brief (voice mode, room mode, skill trees, wearables) is a
new AI surface or new memory-node type layered onto this same foundation — not a
different architecture.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + OpenAI keys
```

1. Create a Supabase project, enable the `vector` extension (already handled in
   `schema.sql`), and run:
   ```bash
   supabase db push   # or paste supabase/schema.sql into the SQL editor
   ```
2. Add your Supabase URL/keys and `OPENAI_API_KEY` to `.env.local`.
3. `npm run dev` and visit `http://localhost:3000`.

Auth uses Supabase magic links — no password flow to build.

## What's scaffolded vs. what's next

**Working end-to-end:** auth, onboarding, memory graph read/write, morning
briefing generation + caching, teach-mode chat, focus-timer session logging,
exam readiness scoring heuristic.

**Structurally ready, not yet built out:** voice mode (swap the chat input for
Web Speech API / a streaming STT provider — the API routes don't change), room
mode / smart-speaker (same briefing/teach APIs, new client), gamification UI
(streaks/achievements tables exist, no UI yet), adaptive-difficulty logic in
Teach Mode (currently prompt-driven; the `accuracy` field on `study_sessions`
is there to make this data-driven later), exam mock-generation.

## Key files

```
supabase/schema.sql            — full DB schema + RLS + memory-match RPC
src/lib/ai/memory-engine.ts    — read/write/dedupe the memory graph
src/lib/ai/prompts.ts          — persona + prompt templates
src/app/api/ai/briefing        — morning briefing generation
src/app/api/ai/chat            — general companion chat
src/app/api/ai/teach           — subject-scoped Socratic tutoring
src/app/api/cron/morning-briefing — daily pre-generation for all users
src/components/dashboard       — greeting, briefing widget, subject grid
src/components/study           — study workspace, teach chat, focus timer
```
