import Anthropic from '@anthropic-ai/sdk';

import { GUIDES } from '@/content/guides';
import { BUSYNESS, COACH_STYLES, goalLabels, OBSTACLES, RHYTHMS } from '@/content/interview';
import type { Profile, WeekSummary } from '@/lib/types';

// Shared by the coach API routes in src/app/api. Server only: never import this from a screen.
// Needs ANTHROPIC_API_KEY in the server environment (a local .env file in development,
// an EAS Hosting secret in production).

const MODEL = 'claude-opus-5-5';
const MAX_NOTES = 7;
const MAX_NOTE_LENGTH = 600;

export const SAFETY_RULES = `You are not a therapist or doctor and do not diagnose or give medical advice. For
health conditions, medication, eating disorders or anything clinical, encourage them to talk to
a doctor or qualified professional. If they mention self-harm, suicide, abuse, crisis or feeling
unsafe, respond with care, encourage them to contact someone they trust or a local crisis line
or emergency number right away, and do not continue with habit coaching in that message.`;

export const GUIDE_LIST = `If one of the app's guides would genuinely help, you may mention it by its exact title (for
example: "the guide 'Start smaller than you think' in the Learn tab"). Only use titles from
this list:
${GUIDES.map((guide) => `- ${guide.title}`).join('\n')}`;

const TONE: Record<Profile['coachStyle'], string> = {
  gentle: 'Warm, patient and encouraging. Never pushy.',
  direct: 'Clear, honest and to the point. Kind, but skip the cushioning.',
  cheerleader: 'Upbeat and celebratory. Make a big deal of their wins.',
};

export function isWeekSummary(value: unknown): value is WeekSummary {
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

/** Profile fields come from the device, so only known values and capped free text are used. */
export function describeProfile(profile: unknown): string | null {
  if (typeof profile !== 'object' || profile === null) return null;
  const p = profile as Partial<Profile>;
  const label = <T extends { id: string; label: string }>(options: T[], id: unknown) =>
    options.find((option) => option.id === id)?.label;
  const goals = Array.isArray(p.goals) ? goalLabels(p.goals) : [];
  const obstacles = Array.isArray(p.obstacles)
    ? OBSTACLES.filter((obstacle) => p.obstacles!.includes(obstacle.id)).map((obstacle) => obstacle.label)
    : [];
  const style = COACH_STYLES.find((option) => option.id === p.coachStyle);

  const lines = [
    typeof p.name === 'string' && p.name.trim() ? `First name: ${p.name.trim().split(' ')[0].slice(0, 30)}` : null,
    goals.length ? `Goals: ${goals.join(', ')}` : null,
    label(RHYTHMS, p.rhythm) ? `Energy: ${label(RHYTHMS, p.rhythm)}` : null,
    label(BUSYNESS, p.busyness) ? `Typical day: ${label(BUSYNESS, p.busyness)}` : null,
    obstacles.length ? `What usually gets in the way: ${obstacles.join(', ')}` : null,
    style ? `Preferred coaching style: ${style.label}. ${TONE[style.id]}` : null,
    typeof p.about === 'string' && p.about.trim() ? `In their own words: ${p.about.trim().slice(0, 300)}` : null,
  ].filter(Boolean);
  return lines.length ? lines.join('\n') : null;
}

export function describeWeek(summary: WeekSummary): string {
  const habits = summary.habits.length
    ? summary.habits.map((habit) => `- ${String(habit.name).slice(0, 60)}: ${habit.count} of 7 days`).join('\n')
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

let client: Anthropic | null = null;

/**
 * Asks Claude and returns the reply text as a JSON Response ({ text } or { error }), so each
 * route only has to build its prompt.
 */
export async function askCoach(
  system: string,
  messages: Anthropic.Beta.BetaMessageParam[],
  refusalMessage: string,
): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'The AI coach is not set up on this server yet.' }, { status: 503 });
  }
  client ??= new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return Response.json({ error: refusalMessage }, { status: 422 });
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
