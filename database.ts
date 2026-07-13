// This file is a hand-written starting point. Once your Supabase project exists,
// regenerate it with: npm run supabase:types

export type MemoryNodeType =
  | 'weak_topic'
  | 'strong_topic'
  | 'preference'
  | 'routine'
  | 'goal'
  | 'mistake_pattern'
  | 'milestone'
  | 'constraint';

export interface Profile {
  id: string;
  full_name: string;
  preferred_name: string | null;
  curriculum: string;
  grade: string | null;
  timezone: string;
  school_start_time: string | null;
  school_end_time: string | null;
  typical_home_time: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  target_grade: number | null;
  current_grade: number | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  due_at: string;
  status: 'pending' | 'in_progress' | 'done' | 'overdue';
  estimated_minutes: number;
  created_at: string;
}

export interface ExamRow {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  predicted_grade: number | null;
  readiness_score: number;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic: string | null;
  started_at: string;
  ended_at: string | null;
  planned_minutes: number | null;
  actual_minutes: number | null;
  accuracy: number | null;
  self_reported_energy: number | null;
  self_reported_focus: number | null;
  started_on_time: boolean | null;
  created_at: string;
}

export interface AiMemoryNode {
  id: string;
  user_id: string;
  node_type: MemoryNodeType;
  subject_id: string | null;
  label: string;
  confidence: number;
  evidence_count: number;
  last_reinforced_at: string;
  created_at: string;
}

export interface AiMemoryEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  relationship: string;
  weight: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  subject_id: string | null;
  mode: 'chat' | 'teach' | 'quiz' | 'briefing';
  title: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface DailyBriefingContent {
  greeting: string;
  quote: string;
  free_time_minutes: number;
  priorities: Array<{
    subject: string;
    reason: string;
    recommended_minutes: number;
  }>;
  schedule: Array<{
    start: string;
    end: string;
    label: string;
  }>;
}

// Minimal Database shape so @supabase/ssr generics resolve.
// Replace with the generated version once you've linked a real project.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      subjects: { Row: Subject; Insert: Partial<Subject>; Update: Partial<Subject> };
      assignments: { Row: Assignment; Insert: Partial<Assignment>; Update: Partial<Assignment> };
      exams: { Row: ExamRow; Insert: Partial<ExamRow>; Update: Partial<ExamRow> };
      study_sessions: { Row: StudySession; Insert: Partial<StudySession>; Update: Partial<StudySession> };
      ai_memory_nodes: { Row: AiMemoryNode; Insert: Partial<AiMemoryNode>; Update: Partial<AiMemoryNode> };
      ai_memory_edges: { Row: AiMemoryEdge; Insert: Partial<AiMemoryEdge>; Update: Partial<AiMemoryEdge> };
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
    };
  };
}
