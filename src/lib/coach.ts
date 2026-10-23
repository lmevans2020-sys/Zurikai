import { offlineReflection } from '@/lib/journal-math';
import type { Profile, Reflection, WeekSummary } from '@/lib/types';

// The AI coach runs on the server (src/app/api/reflection+api.ts) so the AI key never ships
// inside the app. In development the app talks to the Expo dev server; in production set
// EXPO_PUBLIC_API_URL to wherever the server is deployed (for example EAS Hosting).
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function requestReflection(summary: WeekSummary, profile: Profile | null): Promise<Reflection> {
  const createdAt = new Date().toISOString();
  try {
    const response = await fetch(`${API_BASE}/api/reflection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, profile }),
    });
    if (!response.ok) throw new Error(`Coach returned ${response.status}`);
    const { text } = (await response.json()) as { text?: string };
    if (!text) throw new Error('Coach returned an empty reflection');
    return { weekStart: summary.weekStart, text, createdAt, source: 'ai' };
  } catch (error) {
    console.warn('AI coach unavailable, using offline reflection', error);
    return { weekStart: summary.weekStart, text: offlineReflection(summary), createdAt, source: 'offline' };
  }
}
