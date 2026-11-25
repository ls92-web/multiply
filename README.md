# MULTIPLY

A bright, cheerful multiplication practice game for kids aged 7-10. Built with Next.js (App Router, TypeScript), Tailwind CSS, Framer Motion, Supabase, and a synthesized Web Audio sound system.

## What's here

- **Six game modes**: Recall (independent typed answers), Pick It (multiple choice), Fill the Gap (missing-number questions), Beat the Clock (60-second timed round), Perfect Streak (endless, ends on a miss), Try Again (revisits facts the child got wrong or hasn't mastered yet).
- **An adaptive question picker** that weights unmastered and "needs practice" facts higher, and strongly avoids repeating the same fact within the last few questions.
- **A simple mastery model** per multiplication fact (`new -> learning -> developing -> mastered`), where "mastered" requires repeated *independent* (typed, not multiple-choice) correct answers across at least two separate sessions — a lucky streak in one sitting isn't enough.
- **Points and levels**: configurable point values in [`src/lib/engine/scoring.ts`](src/lib/engine/scoring.ts), with streak bonuses at 5 and 10, and a session-completion bonus. Level thresholds in [`src/lib/engine/leveling.ts`](src/lib/engine/leveling.ts) (100 pts for level 2, increasing by 50 each level after).
- **Multiple child profiles** under one household, each with a name, a character avatar (or an uploaded/captured photo), their own points/level/streak/best scores, and independent progress.
- **A private family leaderboard** and a **My Progress** screen with a color-coded multiplication mastery grid.
- **Local demo mode** that works with zero setup (see below) and a parallel Supabase-backed implementation behind the same interface, so turning on a real backend is a config change, not a rewrite.

No emojis anywhere in the UI — all icons are Lucide icons or hand-written SVG.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase environment variables set, the app runs entirely in **local demo mode**: all profiles, points, and mastery data are stored in `localStorage` in your browser. This is real, persistent progress (it survives reloads) — it just isn't shared across devices or backed by a server. The UI doesn't call this out with a banner, but [`src/lib/store/localStore.ts`](src/lib/store/localStore.ts) and [`src/lib/supabase/env.ts`](src/lib/supabase/env.ts) are the places to look if you want to confirm which backend is active (`isDemoMode()`).

### Scripts

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # run a production build
npm run lint     # eslint
npx tsc --noEmit # type-check
npx vitest run   # unit tests
```

## Connecting a real Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in [`supabase/migrations/`](supabase/migrations) in order:
   - `0001_schema.sql` — tables (`children`, `fact_mastery`, `game_sessions`, `question_attempts`) with Row Level Security policies scoping everything to the signed-in parent.
   - `0002_apply_attempt.sql` — two Postgres functions, `apply_attempt()` and `finish_session()`, that do all scoring and mastery/points updates **on the server**. The client sends the raw facts (which multiplication fact, which number was hidden, what the child typed) and these functions independently derive correctness and points — they never trust a `correct` or `points` value sent from the browser. Both are idempotent: replaying the same attempt/session id is a no-op, so a retried network request can't double-award points.
3. Copy `.env.example` to `.env.local` and fill in your project URL and anon key (Project Settings > API). Never put a service-role key in the frontend — it isn't needed anywhere in this app.
4. Enable email/password (or your preferred provider) under Authentication, so a parent can sign in. (Parent sign-in/sign-up screens are not built in this pass — see "Known gaps" below.)
5. Restart the dev server. [`src/lib/store/index.ts`](src/lib/store/index.ts) automatically switches to the Supabase-backed store once both env vars are present.

**This Supabase path is code-complete but has not been exercised against a live project** in the environment this was built in (no credentials were available). Before trusting it in production: run the migrations, create a test parent account, and re-test profile creation, a full game session, and the leaderboard/progress screens end-to-end. [`src/lib/store/supabaseStore.ts`](src/lib/store/supabaseStore.ts) carries the same note inline.

Photo avatars are stored as data URLs in a `text` column for simplicity. For production use with many users, move this to Supabase Storage (an object + signed URL) instead of inlining image bytes in the database — noted inline in `0001_schema.sql`.

## Known gaps / not yet built

- **Parent authentication screens.** The Supabase Auth client and RLS policies are wired up (`src/lib/supabase/`), but there's no sign-in/sign-up UI yet — profile management currently has no login gate in either backend. Add this before deploying with real Supabase credentials and real children's data.
- **Sibling duel / live competition** described in early drafts of this project's brief was descoped in favor of the simpler, single-player-first version implemented here.

## Testing

Unit tests cover the parts of the app where a subtle bug would be easy to miss and hard to notice by eye: question generation, multiple-choice distractors, scoring math, level thresholds, and the mastery state machine (`src/lib/engine/**/__tests__`). Run them with `npx vitest run`.

No emoji characters appear anywhere in the rendered UI — verified by inspection of every user-facing string in `src/app` and `src/components`.

Manually verified in-browser: all six game modes end-to-end (correct/incorrect feedback, scoring, level-up and personal-record celebrations), profile creation (character picker and color picker), the home hub, leaderboard, and progress/mastery-grid screens, at mobile, tablet, and desktop viewport widths.

## Project structure

```
src/
  app/                 Next.js App Router pages
  components/
    ui/                Generic building blocks (Button, Avatar, Panel, ProgressBar, Confetti, Keypad)
    game/               Gameplay-specific UI (QuestionCard, ChoiceGrid, TableSelector, MasteryGrid, ...)
    layout/             TopBar
    providers/          Context providers
  context/              ProfileContext (current player, profile list, sound pref)
  lib/
    engine/             Pure, unit-tested game logic: facts, question generation, distractors, scoring, leveling, mastery
    gameplay/           useGameSession hook that wires the engine to the store for a live play session
    store/               DataStore interface + localStore (demo) + supabaseStore (real backend) implementations
    supabase/            Browser/server Supabase clients, env detection
    sound/               Synthesized Web Audio sound effects
supabase/
  migrations/           SQL schema, RLS policies, and the apply_attempt/finish_session functions
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel.
3. If using a real Supabase backend, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings.
4. Deploy. No other configuration is required — `next.config.ts` disables Next's Cache Components prerendering since this app is entirely client-driven.
