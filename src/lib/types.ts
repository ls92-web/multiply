export type GameMode =
  | "recall"
  | "pickit"
  | "fillgap"
  | "beatclock"
  | "streak"
  | "tryagain";

export const GAME_MODES: GameMode[] = [
  "recall",
  "pickit",
  "fillgap",
  "beatclock",
  "streak",
  "tryagain",
];

export interface ModeInfo {
  id: GameMode;
  name: string;
  tagline: string;
  accent: AccentColor;
}

export type AccentColor =
  | "purple"
  | "blue"
  | "orange"
  | "pink"
  | "mint"
  | "yellow";

export type CharacterId =
  | "boy-short"
  | "boy-curly"
  | "boy-spiky"
  | "girl-ponytail"
  | "girl-pigtails"
  | "girl-long";

export interface AvatarConfig {
  color: AccentColor;
  character: CharacterId;
  /** Data URL of an uploaded/captured photo. When set, shown instead of the illustrated character. */
  photoDataUrl?: string | null;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: AvatarConfig;
  createdAt: string;
  points: number;
  soundOn: boolean;
  lastTables: number[];
  bests: PersonalBests;
}

export interface PersonalBests {
  longestStreak: number;
  beatClockScore: number;
}

export type MasteryState = "new" | "learning" | "developing" | "mastered";

export interface FactMastery {
  factId: string;
  attempts: number;
  correct: number;
  independentCorrect: number;
  independentCorrectStreak: number;
  sessionsSeenCorrectIn: string[];
  lastOutcomeCorrect: boolean | null;
  mastery: MasteryState;
  needsPractice: boolean;
  updatedAt: string;
}

export interface Question {
  factId: string;
  a: number;
  b: number;
  answer: number;
  mode: GameMode;
  choices?: number[];
  missing: "a" | "b" | "product";
}

export interface AttemptRecord {
  id: string;
  sessionId: string;
  factId: string;
  mode: GameMode;
  missingSlot: "a" | "b" | "product";
  userAnswer: number | null;
  correct: boolean;
  independent: boolean;
  responseTimeMs: number;
  isRetryAfterReveal: boolean;
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  profileId: string;
  mode: GameMode;
  tables: number[];
  startedAt: string;
  endedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  pointsEarned: number;
  bestStreakInSession: number;
}

export interface LeaderboardRow {
  profileId: string;
  name: string;
  avatar: AvatarConfig;
  points: number;
  level: number;
  longestStreak: number;
  beatClockScore: number;
  masteredCount: number;
}
