import { askCoach, SAFETY_RULES } from '@/lib/coach-server';

// Server-only route: keeps the coach's short memory of someone up to date. The app sends the
// current memory plus recent chat turns and stores the rewritten memory on the phone.

const MAX_TURNS = 30;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MEMORY_LENGTH = 1500;

const SYSTEM_PROMPT = `You keep the private notes a habit and mood coach uses to remember someone between
conversations in the SteadyThrive app.

You get the current notes (possibly empty) and the latest conversation. Rewrite the notes so they
hold what would help a coach next time: what they're working on, what has helped or not, what
usually gets in the way, wins worth remembering, preferences about how they like to be coached,
and life context they chose to share (for example "two young kids", "works night shifts").

Rules:
- At most 8 short bullet points starting with "- ", under 120 words in total. Plain text only.
- Keep earlier notes that still matter; drop what's outdated or trivial.
- Write facts, not advice. Don't invent anything that wasn't said.
- Leave out passwords, addresses, phone numbers and other identifying details.
- For health or crisis topics keep only a neutral note (for example "mentioned a hard time with
  grief in October"), never details.

${SAFETY_RULES}`;

type Turn = { role: 'user' | 'assistant'; text: string };

function isTurns(value: unknown): value is Turn[] {
  return (
    Array.isArray(value) &&
    value.every(
      (turn) =>
        typeof turn === 'object' &&
        turn !== null &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.text === 'string',
    )
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: { memory?: unknown; messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isTurns(body.messages) || body.messages.length === 0) {
    return Response.json({ error: 'Missing or malformed messages.' }, { status: 400 });
  }
  const memory = typeof body.memory === 'string' ? body.memory.slice(0, MAX_MEMORY_LENGTH) : '';
  const transcript = body.messages
    .slice(-MAX_TURNS)
    .map((turn) => `${turn.role === 'user' ? 'Them' : 'Coach'}: ${turn.text.slice(0, MAX_MESSAGE_LENGTH)}`)
    .join('\n');

  return askCoach(
    SYSTEM_PROMPT,
    [
      {
        role: 'user',
        content: `Current notes:\n${memory || '(none yet)'}\n\nLatest conversation:\n${transcript}\n\nWrite the updated notes.`,
      },
    ],
    'The coach could not update its notes.',
  );
}
