'use client';

import { useEffect, useState } from 'react';
import type { DailyBriefingContent } from '@/lib/types/database';

export function MorningBriefing() {
  const [briefing, setBriefing] = useState<DailyBriefingContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/briefing')
      .then((r) => r.json())
      .then((data) => setBriefing(data.briefing ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-1/3 bg-obsidian-700 rounded mb-3" />
        <div className="h-3 w-2/3 bg-obsidian-700 rounded" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="glass rounded-2xl p-6 text-ink-500">
        No briefing yet — add a subject and an assignment or exam to get your first one.
      </div>
    );
  }

  return (
    <section className="glass rounded-2xl p-6 space-y-5">
      <div>
        <p className="text-gold-400 font-display text-xl">{briefing.greeting}</p>
        <p className="text-ink-500 text-sm mt-1 italic">{briefing.quote}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-ink-500 mb-2">Today's priorities</h3>
          <ul className="space-y-2">
            {briefing.priorities.map((p, i) => (
              <li key={i} className="text-sm">
                <span className="text-ink-100 font-medium">{p.subject}</span>
                <span className="text-ink-500"> — {p.reason} · {p.recommended_minutes} min</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-wide text-ink-500 mb-2">Schedule</h3>
          <ul className="space-y-2">
            {briefing.schedule.map((s, i) => (
              <li key={i} className="text-sm text-ink-300">
                {s.start}–{s.end} · {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-ink-500">
        ~{briefing.free_time_minutes} minutes free today.
      </p>
    </section>
  );
}
