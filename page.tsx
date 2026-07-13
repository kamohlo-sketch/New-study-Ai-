'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    preferred_name: '',
    grade: '',
    school_start_time: '07:30',
    school_end_time: '14:00',
    typical_home_time: '15:00',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
      onboarding_completed: true,
    });

    router.push('/dashboard');
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="block text-sm text-ink-500 mb-1">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl bg-obsidian-800 border border-obsidian-700 px-4 py-3 text-ink-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
    </div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
        <h1 className="font-display text-2xl text-gold-400 mb-1">A few things first</h1>
        <p className="text-ink-500 mb-6">
          This is how your companion starts building its picture of you. It only gets sharper from here.
        </p>

        {field('full_name', 'Full name')}
        {field('preferred_name', 'What should I call you?')}
        {field('grade', 'Grade')}
        {field('school_start_time', 'School starts at', 'time')}
        {field('school_end_time', 'School ends at', 'time')}
        {field('typical_home_time', 'Usually home by', 'time')}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gold-500 text-obsidian-950 font-semibold py-3 hover:bg-gold-400 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Start'}
        </button>
      </form>
    </main>
  );
}
