import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  topic: z.string().nullable().optional(),
  started_at: z.string(),
  ended_at: z.string(),
  planned_minutes: z.number(),
  actual_minutes: z.number(),
  accuracy: z.number().min(0).max(1).nullable().optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    ...parsed.data,
    started_on_time: true, // Compare against the day's briefing schedule for a real signal later.
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
