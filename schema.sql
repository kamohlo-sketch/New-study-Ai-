-- ALLURE Study — Core Schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ─────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  preferred_name text,
  curriculum text default 'CAPS',
  grade text,
  timezone text default 'Africa/Johannesburg',
  school_start_time time,
  school_end_time time,
  typical_home_time time,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- SUBJECTS
-- ─────────────────────────────────────────────────────────
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  color text default '#D4AF61',
  target_grade numeric,
  current_grade numeric,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- ASSIGNMENTS & EXAMS
-- ─────────────────────────────────────────────────────────
create table if not exists assignments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'done', 'overdue')),
  estimated_minutes integer default 30,
  created_at timestamptz default now()
);

create table if not exists exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  title text not null,
  exam_date timestamptz not null,
  predicted_grade numeric,
  readiness_score numeric default 0, -- 0-100, computed by the memory engine
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- STUDY SESSIONS (raw behavioral log — feeds the memory engine)
-- ─────────────────────────────────────────────────────────
create table if not exists study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  topic text,
  started_at timestamptz not null,
  ended_at timestamptz,
  planned_minutes integer,
  actual_minutes integer,
  accuracy numeric,          -- 0-1, from quiz/practice performance during the session
  self_reported_energy integer, -- 1-5
  self_reported_focus integer,  -- 1-5
  started_on_time boolean,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- MEMORY GRAPH
-- Nodes are discrete facts/concepts the AI knows about the student.
-- Edges express relationships between nodes (e.g. "weak_in", "improved_after").
-- This is queried on every AI call to build context, and written to after
-- every session, chat, and quiz.
-- ─────────────────────────────────────────────────────────
create table if not exists ai_memory_nodes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  node_type text not null check (node_type in (
    'weak_topic', 'strong_topic', 'preference', 'routine',
    'goal', 'mistake_pattern', 'milestone', 'constraint'
  )),
  subject_id uuid references subjects(id) on delete set null,
  label text not null,              -- e.g. "Struggles with quadratic factoring"
  confidence numeric default 0.5,   -- 0-1, increases as evidence accumulates
  evidence_count integer default 1,
  embedding vector(1536),           -- for semantic recall across the graph
  last_reinforced_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists ai_memory_edges (
  id uuid primary key default uuid_generate_v4(),
  from_node_id uuid references ai_memory_nodes(id) on delete cascade,
  to_node_id uuid references ai_memory_nodes(id) on delete cascade,
  relationship text not null, -- e.g. 'caused_by', 'improved_after', 'related_to'
  weight numeric default 0.5,
  created_at timestamptz default now()
);

create index if not exists idx_memory_nodes_user on ai_memory_nodes(user_id);
create index if not exists idx_memory_nodes_embedding on ai_memory_nodes
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ─────────────────────────────────────────────────────────
-- CONVERSATIONS (AI chat / teaching threads)
-- ─────────────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  mode text default 'chat' check (mode in ('chat', 'teach', 'quiz', 'briefing')),
  title text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- GAMIFICATION
-- ─────────────────────────────────────────────────────────
create table if not exists streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date
);

create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  key text not null,        -- e.g. 'first_streak_7'
  title text not null,
  description text,
  unlocked_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- DAILY BRIEFINGS (generated once per morning, cached for the day)
-- ─────────────────────────────────────────────────────────
create table if not exists daily_briefings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  briefing_date date not null,
  content jsonb not null, -- structured: greeting, schedule, priorities, quote
  created_at timestamptz default now(),
  unique (user_id, briefing_date)
);

-- ─────────────────────────────────────────────────────────
-- SEMANTIC MATCH RPC
-- Used by the memory engine to find an existing node similar enough to a new
-- candidate that it should be reinforced rather than duplicated.
-- ─────────────────────────────────────────────────────────
create or replace function match_memory_nodes (
  query_user_id uuid,
  query_embedding vector(1536),
  match_threshold float default 0.85,
  match_count int default 1
)
returns table (
  id uuid,
  label text,
  confidence numeric,
  evidence_count integer,
  similarity float
)
language sql stable
as $$
  select
    n.id,
    n.label,
    n.confidence,
    n.evidence_count,
    1 - (n.embedding <=> query_embedding) as similarity
  from ai_memory_nodes n
  where n.user_id = query_user_id
    and n.embedding is not null
    and 1 - (n.embedding <=> query_embedding) > match_threshold
  order by n.embedding <=> query_embedding
  limit match_count;
$$;

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table assignments enable row level security;
alter table exams enable row level security;
alter table study_sessions enable row level security;
alter table ai_memory_nodes enable row level security;
alter table ai_memory_edges enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table streaks enable row level security;
alter table achievements enable row level security;
alter table daily_briefings enable row level security;

-- Owner-only access pattern, applied per table
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own subjects" on subjects for all using (auth.uid() = user_id);
create policy "own assignments" on assignments for all using (auth.uid() = user_id);
create policy "own exams" on exams for all using (auth.uid() = user_id);
create policy "own sessions" on study_sessions for all using (auth.uid() = user_id);
create policy "own memory nodes" on ai_memory_nodes for all using (auth.uid() = user_id);
create policy "own memory edges" on ai_memory_edges for all using (
  exists (select 1 from ai_memory_nodes n where n.id = from_node_id and n.user_id = auth.uid())
);
create policy "own conversations" on conversations for all using (auth.uid() = user_id);
create policy "own messages" on messages for all using (
  exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "own streaks" on streaks for all using (auth.uid() = user_id);
create policy "own achievements" on achievements for all using (auth.uid() = user_id);
create policy "own briefings" on daily_briefings for all using (auth.uid() = user_id);
