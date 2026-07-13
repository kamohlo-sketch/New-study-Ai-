'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_MINUTES = 25;

export function FocusTimer() {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setRunning(false);
          logSession();
          return DEFAULT_MINUTES * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  function toggle() {
    if (!running) startedAtRef.current = new Date();
    setRunning((r) => !r);
  }

  async function logSession() {
    if (!startedAtRef.current) return;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        started_at: startedAtRef.current.toISOString(),
        ended_at: new Date().toISOString(),
        planned_minutes: DEFAULT_MINUTES,
        actual_minutes: DEFAULT_MINUTES,
      }),
    }).catch(() => {
      // Session logging is best-effort — don't block the UI on network hiccups.
    });
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <button
      onClick={toggle}
      className="font-mono text-sm rounded-full border border-obsidian-700 px-4 py-2 hover:border-gold-500/50 transition-colors"
    >
      {mm}:{ss} · {running ? 'Pause' : 'Focus'}
    </button>
  );
}
