export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

export function getGradeLabel(score: number): { label: string; tone: 'emerald' | 'cyan' | 'amber' | 'rose' } {
  if (score >= 85) return { label: 'Sangat Siap TTS (A)', tone: 'emerald' };
  if (score >= 70) return { label: 'Siap TTS (B)', tone: 'cyan' };
  if (score >= 55) return { label: 'Perlu Penguatan (C)', tone: 'amber' };
  return { label: 'Wajib Review Materi (D)', tone: 'rose' };
}
