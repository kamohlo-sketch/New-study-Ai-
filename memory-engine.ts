import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, AiMemoryNode, MemoryNodeType } from '@/lib/types/database';
import { openai, CHAT_MODEL, embed } from './openai';
import { buildMemoryExtractionPrompt } from './prompts';

type TypedClient = SupabaseClient<Database>;

/**
 * Pull the most relevant memory nodes for a user, optionally scoped to a subject.
 * Ordered by a blend of confidence and recency so the AI leads with what matters most.
 */
export async function getMemoryContext(
  supabase: TypedClient,
  userId: string,
  subjectId?: string
): Promise<AiMemoryNode[]> {
  let query = supabase
    .from('ai_memory_nodes')
    .select('*')
    .eq('user_id', userId)
    .order('confidence', { ascending: false })
    .limit(40);

  if (subjectId) {
    query = query.or(`subject_id.eq.${subjectId},subject_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AiMemoryNode[];
}

/**
 * Given raw text (a study session summary, a teach-mode transcript, a chat exchange),
 * ask the model to propose durable memory updates, then upsert them.
 *
 * New evidence for an existing node raises its confidence and evidence_count rather
 * than creating a duplicate — this is what makes the graph feel like it's actually
 * learning instead of just logging.
 */
export async function extractAndWriteMemory(
  supabase: TypedClient,
  userId: string,
  text: string,
  subjectId?: string
) {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: buildMemoryExtractionPrompt(text) }],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{"nodes":[]}';
  const parsed = JSON.parse(raw) as {
    nodes: Array<{ node_type: MemoryNodeType; label: string; confidence: number }>;
  };

  for (const candidate of parsed.nodes) {
    await upsertMemoryNode(supabase, userId, candidate, subjectId);
  }

  return parsed.nodes;
}

async function upsertMemoryNode(
  supabase: TypedClient,
  userId: string,
  candidate: { node_type: MemoryNodeType; label: string; confidence: number },
  subjectId?: string
) {
  // Semantic de-duplication: embed the candidate label and look for an existing
  // node above a similarity threshold before creating a new row.
  const vector = await embed(candidate.label);

  const { data: similar } = await supabase.rpc('match_memory_nodes', {
    query_user_id: userId,
    query_embedding: vector,
    match_threshold: 0.85,
    match_count: 1,
  });

  if (similar && similar.length > 0) {
    const existing = similar[0];
    await supabase
      .from('ai_memory_nodes')
      .update({
        confidence: Math.min(1, existing.confidence + (1 - existing.confidence) * 0.3),
        evidence_count: existing.evidence_count + 1,
        last_reinforced_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return;
  }

  await supabase.from('ai_memory_nodes').insert({
    user_id: userId,
    node_type: candidate.node_type,
    subject_id: subjectId ?? null,
    label: candidate.label,
    confidence: candidate.confidence,
    evidence_count: 1,
    embedding: vector as unknown as string, // supabase-js accepts number[] for vector columns
  });
}

/**
 * Compute exam readiness (0-100) from recent session accuracy and weak-topic density
 * for the subject. Simple, explainable heuristic — swap for a trained model later
 * without changing the calling code.
 */
export async function computeReadiness(
  supabase: TypedClient,
  userId: string,
  subjectId: string
): Promise<number> {
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('accuracy')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .not('accuracy', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: weakNodes } = await supabase
    .from('ai_memory_nodes')
    .select('id')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('node_type', 'weak_topic');

  const avgAccuracy =
    sessions && sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / sessions.length
      : 0.5;

  const weakPenalty = Math.min(30, (weakNodes?.length ?? 0) * 6);
  const score = Math.round(avgAccuracy * 100 - weakPenalty);
  return Math.max(0, Math.min(100, score));
}
