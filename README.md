# SteadyThrive by Zurikai

> Every feeling matters. Every small step counts.

A habit and mood journal with a gentle AI coach. Check in once a day (how you feel, which
habits you kept, a short note), build streaks, and every week get a personal reflection on
what's working.

Built with [Expo](https://expo.dev) (React Native), so one codebase runs on iPhone and Android.

## What's in the app

| Screen | What it does |
| --- | --- |
| **Welcome interview** | First open only: name, goals, daily rhythm, what gets in the way, coaching style. Suggests starter habits for those goals. Can be retaken from Settings. |
| **Today** | Tip of the day (matched to your goals), mood, habits, a note, and your streaks. |
| **History** | Totals, current and best streak, a 14-day mood chart and every past check-in. |
| **Coach** | SteadyThrive Plus: chat with the AI coach anytime, plus a weekly AI-written reflection. Both use your goals, check-ins and preferred coaching style. |
| **Learn** | 13 short guides on building habits, with the ones that fit your goals at the top. |
| **Reminders** | Tap a habit in Settings to get daily phone reminders: at set times, or every few hours within a time window (good for drinking water). |
| **Settings** | Add or remove habits, set reminders, see your plan, erase data. |
| **Paywall** | SteadyThrive Plus: $7.99 / month or $39.99 / year. |

Free plan: unlimited check-ins, up to 3 habits. Plus: weekly AI coach and unlimited habits.

Everything is saved on the phone for now; there are no accounts yet.

## Try it on your phone (about 10 minutes)

You need a computer with [Node.js](https://nodejs.org) (the "LTS" download) and the free
**Expo Go** app on your phone (App Store or Google Play).

1. Download this project (green **Code** button above, then **Download ZIP**) and unzip it.
2. Open a terminal in the project folder and run:
   ```bash
   npm install
   npx expo start
   ```
3. A QR code appears. On iPhone, scan it with the Camera app. On Android, scan it from Expo Go.

The app opens in Expo Go. Edits to the code show up on your phone right away.

### Turning on the AI coach

Without setup the weekly reflection falls back to a simpler built-in summary, and the coach chat
says it isn't connected yet. To turn on the real AI coach:

1. Create an API key at [console.anthropic.com](https://console.anthropic.com).
2. Copy `.env.example` to a new file named `.env` and paste the key after `ANTHROPIC_API_KEY=`.
3. Restart `npx expo start`.

The key stays on the server (`src/app/api/`) and is never put inside the app. Each chat reply
costs roughly a cent in AI usage.

## Getting into the App Store and Google Play

| Step | Cost | Notes |
| --- | --- | --- |
| Expo account at [expo.dev](https://expo.dev/signup) | Free | Builds the iPhone app in the cloud, so no Mac is needed. |
| [Apple Developer Program](https://developer.apple.com/programs/) | $99 / year | Required to publish on the App Store. |
| [Google Play Console](https://play.google.com/console/signup) | $25 once | Required to publish on Google Play. |
| [RevenueCat](https://www.revenuecat.com) | Free to start | Handles subscriptions on both stores. |
| Hosting for the AI coach ([EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)) | Free tier | Then set `EXPO_PUBLIC_API_URL` to its address. |

Still to do before launch:

- **Real payments.** `src/lib/premium.tsx` currently simulates purchases so the flow can be
  tried in Expo Go. Swap in RevenueCat (`react-native-purchases`) once the store products exist.
  This needs a development build (`npx eas-cli@latest build --profile development`).
- **Protect the coach server.** Add sign-in or a per-user limit to the chat and reflection
  endpoints so only paying users can call them and costs stay predictable.
- **App icon and splash screen.** Replace the placeholder images in `assets/`.
- **Privacy policy and store listing** (screenshots, description). Both stores require them.

Build and submit with:

```bash
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform all
```

## For developers

```bash
npm run typecheck   # TypeScript
npm test            # unit tests for streaks, summaries, content and reminder times (src/lib/__tests__)
```

- Screens live in `src/app` (Expo Router). `(tabs)/` holds the five tabs, `welcome.tsx` is the
  first-run interview, `guides/[id].tsx` shows one guide, and `paywall.tsx` is a modal.
- Guides, daily tips and the interview questions are plain data in `src/content/`, so new content
  can be added without touching screen code.
- `src/lib/reminders.ts` schedules habit reminders as local notifications (expo-notifications) and
  re-syncs them whenever habits change; `reminder-times.ts` holds the pure time helpers.
- `src/lib/journal-store.tsx` is the on-device data store; `journal-math.ts` holds the pure
  streak and summary logic.
- `src/app/api/reflection+api.ts` (weekly reflection) and `src/app/api/chat+api.ts` (coach chat)
  are server routes that call Claude through `src/lib/coach-server.ts`, which holds the shared
  safety rules and prompt helpers. `src/lib/coach.ts` is the app side that calls them.
