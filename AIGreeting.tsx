'use client';

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function AIGreeting({ preferredName }: { preferredName: string }) {
  return (
    <header>
      <h1 className="font-display text-3xl text-ink-100">
        {timeOfDayGreeting()}, {preferredName}.
      </h1>
      <p className="text-ink-500 mt-1">Here's where things stand today.</p>
    </header>
  );
}
