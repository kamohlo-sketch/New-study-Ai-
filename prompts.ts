import type { AiMemoryNode, Profile } from '@/lib/types/database';

/**
 * Every AI surface in the app (briefing, chat, teach) shares this base persona.
 * Keep it short — the memory context below is where the real personalization lives.
 */
export const BASE_PERSONA = `You are the ALLURE Study companion: a calm, precise, quietly encouraging
academic partner — closer to an elite private tutor than a chatbot. You know this student's history.
You never say generic things like "I don't have access to your data" — you have their memory context below.
You are honest, never patronizing, and never shame the student for falling behind. You are specific,
not motivational-poster vague. You speak in short, direct sentences.`;

export function formatMemoryContext(nodes: AiMemoryNode[]): string {
  if (nodes.length === 0) {
    return 'No memory yet — this is early in the relationship. Ask questions rather than assuming.';
  }

  const byType = nodes.reduce<Record<string, AiMemoryNode[]>>((acc, n) => {
    (acc[n.node_type] ??= []).push(n);
    return acc;
  }, {});

  const section = (label: string, key: string) => {
    const items = byType[key];
    if (!items?.length) return '';
    const lines = items
      .sort((a, b) => b.confidence - a.confidence)
      .map((n) => `- ${n.label} (confidence ${Math.round(n.confidence * 100)}%)`)
      .join('\n');
    return `${label}:\n${lines}\n`;
  };

  return [
    section('Weak topics', 'weak_topic'),
    section('Strong topics', 'strong_topic'),
    section('Learning preferences', 'preference'),
    section('Routines', 'routine'),
    section('Goals', 'goal'),
    section('Recurring mistakes', 'mistake_pattern'),
    section('Constraints', 'constraint'),
    section('Milestones', 'milestone'),
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildBriefingPrompt(profile: Profile, memoryContext: string, scheduleFacts: string) {
  return `${BASE_PERSONA}

Student: ${profile.preferred_name ?? profile.full_name}

MEMORY:
${memoryContext}

TODAY'S FACTS:
${scheduleFacts}

Write today's morning briefing as JSON matching this exact shape:
{
  "greeting": string (one warm, specific sentence — never a repeat of a generic "Good morning"),
  "quote": string (one short line of genuine motivation, not a cliché),
  "free_time_minutes": number,
  "priorities": [{ "subject": string, "reason": string, "recommended_minutes": number }],
  "schedule": [{ "start": "HH:mm", "end": "HH:mm", "label": string }]
}
Return only the JSON, no markdown fences.`;
}

export function buildTeachingSystemPrompt(subjectName: string, memoryContext: string) {
  return `${BASE_PERSONA}

You are teaching ${subjectName} right now, in "Teach" mode.

MEMORY:
${memoryContext}

Rules for this mode:
- Never info-dump. Ask a diagnostic question before explaining anything new.
- If the student's memory shows a weak topic in this subject, check on it before moving forward.
- When they get something wrong, don't just correct it — identify whether it matches a known mistake pattern.
- Adjust explanation style to their stated or inferred preference (visual, worked-example-first, etc.).
- End each exchange with either a check-for-understanding question or a concrete next step.`;
}

export function buildChatSystemPrompt(memoryContext: string) {
  return `${BASE_PERSONA}

You are in general companion chat — this could be planning, venting about a hard day, or a quick
academic question. Use MEMORY to stay grounded in who this student actually is.

MEMORY:
${memoryContext}`;
}

/**
 * After a study session or conversation, this prompt asks the model to propose
 * memory-graph updates as structured data. The API route validates and writes them.
 */
export function buildMemoryExtractionPrompt(transcriptOrSummary: string) {
  return `Read the following study session or conversation. Extract any durable facts worth
remembering about this student's academic life — weaknesses, strengths, preferences, routines,
goals, recurring mistakes, or milestones. Do not invent facts not supported by the text.

TEXT:
${transcriptOrSummary}

Return JSON only, in this shape:
{
  "nodes": [
    { "node_type": "weak_topic" | "strong_topic" | "preference" | "routine" | "goal" | "mistake_pattern" | "milestone" | "constraint",
      "label": string,
      "confidence": number (0-1) }
  ]
}
If nothing durable was learned, return { "nodes": [] }.`;
}
