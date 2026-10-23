import { askCoach, describeProfile, describeWeek, GUIDE_LIST, isWeekSummary, SAFETY_RULES } from '@/lib/coach-server';

// Server-only route: one turn of the coach chat. The app sends the recent conversation plus
// context (profile, this week's check-ins, streak) and gets the coach's next reply.

const MAX_TURNS = 20;
const MAX_MESSAGE_LENGTH = 1000;

const SYSTEM_PROMPT = `You are the coach inside Zurikai, a habit and mood journal app. People chat with you
for encouragement and practical advice on building habits, staying consistent and looking after
their mood.

How to reply:
- Keep replies short and conversational: usually 2 to 5 sentences, like a text from a
  thoughtful friend who knows about habits. No headings. Use a short list only when they ask
  for steps or options.
- Be specific to them. Use what you know about their goals, schedule, habits and recent
  check-ins, but don't recite their data back to them.
- Prefer one small, concrete next step over a long plan. Ask a gentle question when it would
  help you understand what's getting in the way.
- Stay on topic: habits, routines, motivation, mood, sleep, movement, stress, focus and
  similar wellbeing topics. If asked about something unrelated, kindly steer back.
- Match the coaching style they asked for.

${SAFETY_RULES}

${GUIDE_LIST}`;

type ChatTurn = { role: 'user' | 'assistant'; text: string };

function isChatTurns(value: unknown): value is ChatTurn[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (turn) =>
        typeof turn === 'object' &&
        turn !== null &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.text === 'string',
    )
  );
}

function describeContext(profile: unknown, week: unknown, streak: unknown): string {
  const parts = [
    describeProfile(profile) ? `About them:\n${describeProfile(profile)}` : null,
    isWeekSummary(week) ? `Their check-ins this week:\n${describeWeek(week)}` : null,
    typeof streak === 'number' ? `Current check-in streak: ${Math.max(0, Math.floor(streak))} days` : null,
  ].filter(Boolean);
  return parts.length ? parts.join('\n\n') : 'No details about this person yet.';
}

export async function POST(request: Request): Promise<Response> {
  let body: { messages?: unknown; profile?: unknown; week?: unknown; streak?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isChatTurns(body.messages)) {
    return Response.json({ error: 'Missing or malformed messages.' }, { status: 400 });
  }

  // Only the latest turns are sent, starting from a user message as the API requires.
  let turns = body.messages.slice(-MAX_TURNS);
  while (turns.length > 0 && turns[0].role !== 'user') turns = turns.slice(1);
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return Response.json({ error: 'The last message must be from the user.' }, { status: 400 });
  }

  return askCoach(
    `${SYSTEM_PROMPT}\n\nWhat you know about this person (from the app, not typed by them in chat):\n${describeContext(body.profile, body.week, body.streak)}`,
    turns.map((turn) => ({ role: turn.role, content: turn.text.slice(0, MAX_MESSAGE_LENGTH) })),
    "Sorry, I can't help with that one. Is there something about your habits or how you're feeling I can help with?",
  );
}
