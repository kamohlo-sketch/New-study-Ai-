'use client';

import { useState } from 'react';
import type { Subject } from '@/lib/types/database';
import { TeachChatPanel } from './TeachChatPanel';
import { FocusTimer } from './FocusTimer';

export function StudyWorkspace({ subject }: { subject: Subject }) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  return (
    <main className="h-screen flex">
      <section className="flex-1 flex flex-col border-r border-obsidian-800">
        <header className="px-6 py-4 border-b border-obsidian-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Study Mode</p>
            <h1 className="font-display text-xl text-ink-100">{subject.name}</h1>
          </div>
          <FocusTimer />
        </header>
        <div className="flex-1 overflow-hidden">
          <TeachChatPanel
            subjectId={subject.id}
            subjectName={subject.name}
            conversationId={conversationId}
            onConversationStart={setConversationId}
          />
        </div>
      </section>
    </main>
  );
}
