'use client';

import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function TeachChatPanel({
  subjectId,
  subjectName,
  conversationId,
  onConversationStart,
}: {
  subjectId: string;
  subjectName: string;
  conversationId: string | null;
  onConversationStart: (id: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Let's work on ${subjectName}. Tell me what you're stuck on, or say "quiz me" to start.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setMessages((m) => [...m, { role: 'user', content: userMessage }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          subjectId,
          subjectName,
          message: userMessage,
        }),
      });
      const data = await res.json();
      if (data.conversationId && !conversationId) onConversationStart(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? '…' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-lg rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-gold-500 text-obsidian-950'
                  : 'bg-obsidian-800 text-ink-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="text-ink-500 text-sm">Thinking…</div>}
      </div>

      <div className="px-6 py-4 border-t border-obsidian-800 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask a question, or say what you're stuck on…"
          className="flex-1 rounded-xl bg-obsidian-800 border border-obsidian-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-xl bg-gold-500 text-obsidian-950 font-semibold px-5 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
