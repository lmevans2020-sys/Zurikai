import { offlineReflection } from '@/lib/journal-math';
import { offlineLetter, type MonthSummary } from '@/lib/letter';
import type { ChatMessage, Letter, Profile, Reflection, WeekSummary } from '@/lib/types';

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

/** Sends the conversation to the coach and returns its reply, or a friendly error to show. */
export async function sendChat(
  messages: ChatMessage[],
  context: { profile: Profile | null; week: WeekSummary; streak: number; challenge?: { id: string; done: number } | null; memory?: string },
): Promise<{ text: string; failed: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.filter((m) => !m.failed).map(({ role, text }) => ({ role, text })),
        ...context,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { text?: string; error?: string };
    if (response.ok && body.text) return { text: body.text, failed: false };
    if (response.status === 503) {
      return { text: "I'm not connected yet. Once the AI key is added to the server, I'll be able to chat.", failed: true };
    }
    return { text: body.error ?? "Sorry, I couldn't reply just now. Please try again.", failed: true };
  } catch (error) {
    console.warn('Coach chat failed', error);
    return { text: "I can't reach the coach right now. Check your connection and try again.", failed: true };
  }
}

/** Asks the coach to rewrite its notes about someone from the latest chat. Null if it can't. */
export async function updateMemory(memory: string, messages: ChatMessage[]): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memory,
        messages: messages.filter((m) => !m.failed).map(({ role, text }) => ({ role, text })),
      }),
    });
    if (!response.ok) return null;
    const { text } = (await response.json()) as { text?: string };
    return text?.trim() || null;
  } catch {
    return null;
  }
}

export async function requestLetter(
  summary: MonthSummary,
  profile: Profile | null,
  memory: string | undefined,
): Promise<Letter> {
  const createdAt = new Date().toISOString();
  try {
    const response = await fetch(`${API_BASE}/api/letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, profile, memory }),
    });
    if (!response.ok) throw new Error(`Coach returned ${response.status}`);
    const { text } = (await response.json()) as { text?: string };
    if (!text) throw new Error('Coach returned an empty letter');
    return { month: summary.month, text, createdAt, source: 'ai' };
  } catch (error) {
    console.warn('AI coach unavailable, using offline letter', error);
    const firstName = profile?.name.trim().split(' ')[0] || undefined;
    return { month: summary.month, text: offlineLetter(summary, firstName), createdAt, source: 'offline' };
  }
}
