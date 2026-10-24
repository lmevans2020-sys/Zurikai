import { askCoach, describeProfile, GUIDE_LIST, SAFETY_RULES } from '@/lib/coach-server';
import { describeMonth, isMonthSummary } from '@/lib/letter';

// Server-only route: writes the monthly letter from the coach.

const MAX_MEMORY_LENGTH = 1500;

const SYSTEM_PROMPT = `You are the coach inside SteadyThrive (by Zurikai), a habit and mood journal. Once a
month you write the person a short personal letter about their month.

Write 150 to 220 words, starting with "Dear <first name>," (or "Hello," if you don't know their
name) and signing off "Your coach". Warm, plain, second-person language, like a letter from a
thoughtful friend who knows about habits. Celebrate real progress from the numbers, notice one
pattern (for example a habit that lines up with better mood), acknowledge anything hard
without dwelling on it, and end with one or two small, specific intentions for next month.
Use your notes from earlier conversations if they help, without quoting them. Short paragraphs,
no headings, lists or emoji. Match their preferred coaching style.

${SAFETY_RULES}

${GUIDE_LIST}`;

export async function POST(request: Request): Promise<Response> {
  let body: { summary?: unknown; profile?: unknown; memory?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isMonthSummary(body.summary)) {
    return Response.json({ error: 'Missing or malformed month summary.' }, { status: 400 });
  }
  const about = describeProfile(body.profile);
  const memory = typeof body.memory === 'string' ? body.memory.slice(0, MAX_MEMORY_LENGTH).trim() : '';
  const prompt = [
    about ? `About them:\n${about}` : null,
    memory ? `Your notes from earlier conversations:\n${memory}` : null,
    `Their month:\n${describeMonth(body.summary)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return askCoach(SYSTEM_PROMPT, [{ role: 'user', content: prompt }], 'The coach could not write a letter this month.');
}
