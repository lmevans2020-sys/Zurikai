import { askCoach, describeProfile, describeWeek, GUIDE_LIST, isWeekSummary, SAFETY_RULES } from '@/lib/coach-server';
import type { WeekSummary } from '@/lib/types';

// Server-only route: writes the weekly coach reflection with Claude.

const SYSTEM_PROMPT = `You are the coach inside Zurikai, a habit and mood journal.
Each week you read a short summary of someone's check-ins and write them a reflection.

Write 120 to 180 words in plain, warm, second-person language, like a thoughtful friend who
happens to know about habits. Notice one or two real patterns in the data (for example how
habits line up with better or worse days), name one thing they did well, and end with one
small, specific suggestion for next week. Use short paragraphs and no headings, lists or emoji.

You may be told about the person's goals, daily rhythm, usual obstacles and preferred coaching
style. Connect your reflection to their goals, make your suggestion fit their schedule and
obstacles, and match the tone they asked for.

${SAFETY_RULES}

${GUIDE_LIST}`;

function buildPrompt(summary: WeekSummary, profile: unknown): string {
  const about = describeProfile(profile);
  return about ? `About them:\n${about}\n\nThis week:\n${describeWeek(summary)}` : describeWeek(summary);
}

export async function POST(request: Request): Promise<Response> {
  let summary: unknown;
  let profile: unknown;
  try {
    ({ summary, profile } = (await request.json()) as { summary: unknown; profile?: unknown });
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isWeekSummary(summary)) {
    return Response.json({ error: 'Missing or malformed week summary.' }, { status: 400 });
  }

  return askCoach(
    SYSTEM_PROMPT,
    [{ role: 'user', content: buildPrompt(summary, profile) }],
    'The coach could not write a reflection for this week.',
  );
}
