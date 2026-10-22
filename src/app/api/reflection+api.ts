import Anthropic from '@anthropic-ai/sdk';

import type { WeekSummary } from '@/lib/types';

// Server-only route: writes the weekly coach reflection with Claude.
// Needs ANTHROPIC_API_KEY in the server environment (a local .env file in development,
// an EAS Hosting secret in production). It is never bundled into the app.

const MODEL = 'claude-opus-5-5';
const MAX_NOTES = 7;
const MAX_NOTE_LENGTH = 600;

const SYSTEM_PROMPT = `You are the coach inside Zurikai, a habit and mood journal.
Each week you read a short summary of someone's check-ins and write them a reflection.

Write 120 to 180 words in plain, warm, second-person language, like a thoughtful friend who
happens to know about habits. Notice one or two real patterns in the data (for example how
habits line up with better or worse days), name one thing they did well, and end with one
small, specific suggestion for next week. Use short paragraphs and no headings, lists or emoji.

You are not a therapist and do not diagnose. If the notes mention self-harm, crisis or feeling
unsafe, gently encourage them to reach out to someone they trust or a local crisis line, and
keep the rest brief.`;

let client: Anthropic | null = null;

function isWeekSummary(value: unknown): value is WeekSummary {
  const summary = value as WeekSummary;
  return (
    typeof summary === 'object' &&
    summary !== null &&
    typeof summary.weekStart === 'string' &&
    typeof summary.daysLogged === 'number' &&
    Array.isArray(summary.habits) &&
    Array.isArray(summary.notes)
  );
}

function describeWeek(summary: WeekSummary): string {
  const habits = summary.habits.length
    ? summary.habits.map((habit) => `- ${habit.name}: ${habit.count} of 7 days`).join('\n')
    : '- none checked off';
  const notes = summary.notes.length
    ? summary.notes
        .slice(0, MAX_NOTES)
        .map((note) => `- ${note.date} (mood ${note.mood}/5): ${String(note.note).slice(0, MAX_NOTE_LENGTH)}`)
        .join('\n')
    : '- no notes';

  return [
    `Week starting ${summary.weekStart}`,
    `Days checked in: ${summary.daysLogged} of 7`,
    `Average mood (1-5): ${summary.averageMood ?? 'n/a'}`,
    summary.bestDay ? `Best day: ${summary.bestDay.date} (mood ${summary.bestDay.mood})` : null,
    summary.roughestDay ? `Hardest day: ${summary.roughestDay.date} (mood ${summary.roughestDay.mood})` : null,
    `Habits:\n${habits}`,
    `Notes they wrote:\n${notes}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'The AI coach is not set up on this server yet.' }, { status: 503 });
  }

  let summary: unknown;
  try {
    ({ summary } = (await request.json()) as { summary: unknown });
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isWeekSummary(summary)) {
    return Response.json({ error: 'Missing or malformed week summary.' }, { status: 400 });
  }

  client ??= new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: describeWeek(summary) }],
    });

    if (response.stop_reason === 'refusal') {
      return Response.json({ error: 'The coach could not write a reflection for this week.' }, { status: 422 });
    }

    const text = response.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('\n')
      .trim();

    return Response.json({ text });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'The coach is busy. Try again in a minute.' }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API error', error.status, error.message);
      return Response.json({ error: 'The coach is unavailable right now.' }, { status: 502 });
    }
    throw error;
  }
}
