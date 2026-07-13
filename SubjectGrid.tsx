import Link from 'next/link';
import type { Subject } from '@/lib/types/database';

export function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-ink-500">
        No subjects yet. Add your first subject to start building your memory graph.
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-sm uppercase tracking-wide text-ink-500 mb-3">Subjects</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/study/${s.id}`}
            className="glass rounded-2xl p-5 hover:border-gold-500/40 transition-colors"
          >
            <div className="h-2 w-10 rounded-full mb-4" style={{ backgroundColor: s.color }} />
            <p className="font-display text-lg text-ink-100">{s.name}</p>
            {s.current_grade != null && s.target_grade != null && (
              <p className="text-xs text-ink-500 mt-1">
                {s.current_grade}% → target {s.target_grade}%
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
