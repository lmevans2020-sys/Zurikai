// Habit and wellbeing guides shown in the Learn tab, plus the short daily tips on Today.
// Plain data so new content can be added here without touching any screen code.

export type Guide = {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  minutes: number;
  /** Paragraphs. A paragraph starting with "• " is shown as a bullet point. */
  body: string[];
  /** One thing to try today, shown highlighted at the end. */
  tryThis: string;
};

export const GUIDES: Guide[] = [
  {
    id: 'start-tiny',
    emoji: '🌱',
    title: 'Start smaller than you think',
    summary: 'Why a two-minute version of a habit beats a big plan.',
    minutes: 2,
    body: [
      'Most new habits fail on the hardest days, not the easy ones. If your habit only works when you have energy and free time, it will disappear the first busy week.',
      'The fix is to shrink the habit until it feels almost too easy. "Go for a run" becomes "put on my running shoes". "Read more" becomes "read one page". "Meditate" becomes "take three slow breaths".',
      'This works because the hardest part of most habits is starting. Once you have started, doing a little more often happens on its own. And on bad days, the tiny version still counts, so your streak survives.',
      'When the tiny version feels automatic, grow it a little. Habits are built by showing up, not by how much you do each time.',
    ],
    tryThis: 'Pick one habit and write down its two-minute version. Do only that today.',
  },
  {
    id: 'habit-stacking',
    emoji: '🔗',
    title: 'Stack it onto something you already do',
    summary: 'Use your existing routine as a reminder.',
    minutes: 2,
    body: [
      'You already have dozens of habits you do without thinking: making coffee, brushing your teeth, sitting down at your desk. Each one is a ready-made reminder.',
      'Habit stacking means attaching the new habit to one of these. The formula is simple: "After I [current habit], I will [new habit]."',
      '• After I pour my morning coffee, I will drink a glass of water.',
      '• After I sit down for lunch, I will take a two-minute walk first.',
      '• After I plug in my phone at night, I will write one line in my journal.',
      'Be specific about the moment. "In the morning" is vague. "Right after I turn off the kettle" is a clear trigger your brain can learn.',
    ],
    tryThis: 'Finish this sentence for one habit: "After I ___, I will ___."',
  },
  {
    id: 'when-where',
    emoji: '📍',
    title: 'Decide when and where',
    summary: 'A specific plan makes you much more likely to follow through.',
    minutes: 2,
    body: [
      'Intentions like "I will exercise more" rarely survive a busy week. Plans like "I will walk for 10 minutes at 12:30 on Monday, Wednesday and Friday, starting from the front door" do much better.',
      'Researchers call these if-then plans. Deciding the time and place in advance means you don\'t have to make a fresh decision when the moment comes, which is exactly when willpower is lowest.',
      'You can also plan for obstacles. "If it\'s raining, I will do 10 minutes of stretching in the living room instead." Having a backup ready keeps a small problem from breaking the habit.',
    ],
    tryThis: 'For one habit, write down the exact time, place and a rainy-day backup.',
  },
  {
    id: 'environment',
    emoji: '🏡',
    title: 'Make it easy to see and easy to do',
    summary: 'Shape your surroundings so good habits happen by default.',
    minutes: 2,
    body: [
      'Your environment quietly decides a lot of your behavior. People drink more water when a bottle is on their desk, and snack more when snacks are on the counter.',
      'Make good habits obvious and easy:',
      '• Leave your book on your pillow.',
      '• Put your workout clothes out the night before.',
      '• Keep a water bottle where you can see it.',
      'Make unhelpful habits a little harder. Move social apps off your home screen, or charge your phone outside the bedroom. Even a few seconds of extra effort is often enough to break an automatic pattern.',
    ],
    tryThis: 'Change one thing in your space tonight that makes tomorrow\'s habit easier.',
  },
  {
    id: 'never-miss-twice',
    emoji: '🔁',
    title: 'Missed a day? Never miss twice',
    summary: 'How to recover from a slip without starting over.',
    minutes: 2,
    body: [
      'Everyone misses days. Illness, travel and hard weeks happen. Missing once is not what breaks a habit. Giving up after missing is.',
      'A helpful rule is "never miss twice". If you skip today, make tomorrow\'s priority simply doing the tiny version, however small.',
      'Research on habit formation has found that missing a single day does not meaningfully slow down how quickly a habit becomes automatic. What matters is getting back to it.',
      'So be kind to yourself. A broken streak is just information about what got in the way. Notice it, adjust your plan if needed, and start again.',
    ],
    tryThis: 'Think of what usually knocks you off track and plan your "comeback" version now.',
  },
  {
    id: 'how-long',
    emoji: '⏳',
    title: 'How long does a habit take?',
    summary: 'Spoiler: it\'s not 21 days, and that\'s okay.',
    minutes: 2,
    body: [
      'You may have heard that it takes 21 days to form a habit. That number doesn\'t come from research.',
      'In one well-known study, people took an average of about 66 days for a simple daily habit to feel automatic, with a huge range from a few weeks to most of a year. Simpler habits, like drinking water with breakfast, got automatic faster than harder ones, like doing sit-ups.',
      'The takeaway: if a habit still takes effort after three weeks, nothing is wrong with you. Keep the habit small, keep it tied to the same trigger, and give it time.',
    ],
    tryThis: 'Look at your History tab and notice how many days you have already put in.',
  },
  {
    id: 'mood-and-habits',
    emoji: '🌤️',
    title: 'The habits that lift your mood',
    summary: 'Sleep, movement, daylight and people, and how to notice what helps you.',
    minutes: 3,
    body: [
      'Some everyday habits have a strong, well-studied link with how we feel:',
      '• Sleep. Regular sleep and wake times tend to help mood and energy more than catching up at weekends.',
      '• Movement. Even a short walk can lift your mood. You don\'t need a full workout for it to count.',
      '• Daylight. Getting outside early in the day can help your sleep and energy.',
      '• Connection. A short chat or message with someone you care about makes a real difference.',
      'Everyone is different, which is why Zurikai asks for your mood alongside your habits. After a few weeks, look at your History and your weekly Coach reflection. Do your better days line up with certain habits? That\'s your personal recipe.',
    ],
    tryThis: 'Add one mood-lifting habit to your list in Settings, like "10 minutes outside".',
  },
  {
    id: 'self-compassion',
    emoji: '💛',
    title: 'Be kind to yourself',
    summary: 'Why self-criticism makes habits harder, not easier.',
    minutes: 2,
    body: [
      'It\'s tempting to think being hard on yourself will keep you disciplined. In practice, harsh self-talk after a slip tends to make people feel worse and give up sooner.',
      'Self-compassion means talking to yourself the way you would talk to a good friend. "That was a tough week, and it makes sense I skipped a few days. Let\'s do the small version tomorrow."',
      'This isn\'t letting yourself off the hook. People who respond to setbacks with kindness are often more likely to try again, because restarting doesn\'t feel like a punishment.',
      'If you\'re going through a really hard time, habits can wait. Reach out to someone you trust, or a local support line if you need it.',
    ],
    tryThis: 'Next time you miss a habit, write a kind note to yourself in your check-in.',
  },
  {
    id: 'better-sleep',
    emoji: '😴',
    title: 'Small steps to better sleep',
    summary: 'A steady rhythm matters more than a perfect night.',
    minutes: 3,
    body: [
      'Good sleep is one of the most powerful habits for mood, energy and focus. The good news is that small, steady changes add up.',
      '• Keep a regular wake-up time, even at weekends. It anchors your body clock more than bedtime does.',
      '• Get some daylight soon after waking. It helps you feel alert in the morning and sleepy at night.',
      '• Give yourself a wind-down: dim lights and put screens away for the last 30 minutes before bed.',
      '• Keep caffeine to the morning and early afternoon.',
      'Don\'t try all of these at once. Pick one and make it your habit for the next two weeks.',
      'If you regularly struggle to sleep or feel exhausted despite enough time in bed, it\'s worth talking to a doctor.',
    ],
    tryThis: 'Choose a wake-up time you can keep every day this week, and set an alarm for it.',
  },
  {
    id: 'move-more',
    emoji: '🚶',
    title: 'Moving more without a gym',
    summary: 'Everyday movement counts, and a little goes a long way.',
    minutes: 2,
    body: [
      'You don\'t need a gym membership or a big workout plan to feel the benefits of movement. Short bursts spread through the day are a great start.',
      '• Take a 10-minute walk after a meal.',
      '• Walk or stand while you\'re on a phone call.',
      '• Do a few stretches while the kettle boils.',
      'The best kind of movement is the one you enjoy enough to repeat. Dancing in the kitchen counts.',
      'If you have a health condition or haven\'t been active in a while, check with a doctor before starting anything strenuous.',
    ],
    tryThis: 'Pick one moment today, like after lunch, and take a 10-minute walk.',
  },
  {
    id: 'calm-stress',
    emoji: '🌿',
    title: 'Two-minute ways to calm stress',
    summary: 'Quick resets you can do anywhere.',
    minutes: 2,
    body: [
      'Stress is a normal part of life, but small daily habits can help your body and mind recover from it.',
      '• Slow breathing. Breathe in for a count of four and out for a count of six. A longer out-breath helps your body settle.',
      '• Step outside. A few minutes of fresh air and daylight can shift your mood.',
      '• Name it. Writing down what\'s on your mind, even one line, can make it feel more manageable.',
      '• Move. A short walk is one of the simplest ways to burn off tension.',
      'These are small resets, not a cure-all. If stress feels overwhelming or won\'t ease, reach out to someone you trust or a professional.',
    ],
    tryThis: 'Right now, try five slow breaths: in for four, out for six.',
  },
  {
    id: 'eat-well',
    emoji: '🥗',
    title: 'Eating well, one swap at a time',
    summary: 'Add good things in rather than cutting everything out.',
    minutes: 2,
    body: [
      'Strict diets are hard to keep up. A gentler approach is to add one good thing at a time instead of banning foods.',
      '• Drink a glass of water with every meal.',
      '• Add one fruit or vegetable to a meal you already eat.',
      '• Keep a healthy snack where you\'ll see it first.',
      'Small swaps are easier to stick with, and over weeks they make a real difference.',
      'For specific dietary needs or health conditions, a doctor or registered dietitian can give advice that fits you.',
    ],
    tryThis: 'Choose one meal tomorrow and add a fruit or vegetable to it.',
  },
  {
    id: 'focus',
    emoji: '🎯',
    title: 'Getting focused, one block at a time',
    summary: 'Short focused sessions beat long distracted ones.',
    minutes: 2,
    body: [
      'Focus is less about willpower and more about setting things up so distraction is harder.',
      '• Decide your top three tasks for the day before you start.',
      '• Work in short blocks, like 25 minutes, then take a five-minute break.',
      '• Put your phone in another room or out of sight during a focus block.',
      'Start with just one focused block a day. Once that feels normal, add another.',
    ],
    tryThis: 'Write down your top three for tomorrow before you finish today.',
  },
];

export const DAILY_TIPS: { text: string; guideId: string }[] = [
  { text: 'Shrink today\'s hardest habit to a two-minute version.', guideId: 'start-tiny' },
  { text: 'Attach a new habit to something you already do every day.', guideId: 'habit-stacking' },
  { text: 'Decide exactly when and where you\'ll do your habit today.', guideId: 'when-where' },
  { text: 'Put something you need for tomorrow\'s habit where you\'ll see it.', guideId: 'environment' },
  { text: 'Missed yesterday? Today, just do the smallest version.', guideId: 'never-miss-twice' },
  { text: 'Habits take time. Weeks of practice are normal, not a sign of failure.', guideId: 'how-long' },
  { text: 'A ten-minute walk outside can lift your mood more than you expect.', guideId: 'mood-and-habits' },
  { text: 'Talk to yourself like you\'d talk to a good friend.', guideId: 'self-compassion' },
  { text: 'Have a rainy-day backup plan for your most important habit.', guideId: 'when-where' },
  { text: 'Make one unhelpful habit a little harder to do today.', guideId: 'environment' },
  { text: 'Going to bed at the same time each night helps mood and energy.', guideId: 'mood-and-habits' },
  { text: 'Showing up matters more than how much you do.', guideId: 'start-tiny' },
  { text: 'Send a quick message to someone you care about.', guideId: 'mood-and-habits' },
  { text: 'A broken streak is information, not a verdict. Start again today.', guideId: 'self-compassion' },
  { text: 'Wake up at the same time today as yesterday.', guideId: 'better-sleep' },
  { text: 'Dim the lights and put your phone away 30 minutes before bed.', guideId: 'better-sleep' },
  { text: 'Take a short walk after one meal today.', guideId: 'move-more' },
  { text: 'Stand up and stretch while the kettle boils.', guideId: 'move-more' },
  { text: 'Feeling tense? Breathe in for four, out for six, five times.', guideId: 'calm-stress' },
  { text: 'Write down one thing that\'s on your mind to get it out of your head.', guideId: 'calm-stress' },
  { text: 'Add one fruit or vegetable to a meal you already eat.', guideId: 'eat-well' },
  { text: 'Drink a glass of water with your next meal.', guideId: 'eat-well' },
  { text: 'Pick your top three tasks before you open your inbox.', guideId: 'focus' },
  { text: 'Put your phone out of sight for one 25-minute block.', guideId: 'focus' },
];

/**
 * The same tip all day, changing at midnight. When the person has recommended guides (from
 * their welcome interview), tips come from those guides two days out of three.
 */
export function tipForDate(dateKey: string, preferredGuideIds: string[] = []) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  const preferred = DAILY_TIPS.filter((tip) => preferredGuideIds.includes(tip.guideId));
  const pool = preferred.length > 0 && dayNumber % 3 !== 0 ? preferred : DAILY_TIPS;
  return pool[dayNumber % pool.length];
}

export function guideById(id: string) {
  return GUIDES.find((guide) => guide.id === id);
}
