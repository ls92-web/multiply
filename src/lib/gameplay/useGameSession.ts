"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStore } from "@/lib/store";
import {
  AttemptRecord,
  ChildProfile,
  FactMastery,
  GameMode,
  Question,
  SessionSummary,
} from "@/lib/types";
import { buildFactPairs, canonicalFactId } from "@/lib/engine/facts";
import {
  expectedInputAnswer,
  generateQuestion,
  isIndependentMode,
  selectNextFact,
} from "@/lib/engine/question";
import { recordAttempt } from "@/lib/engine/mastery";
import { scoreAnswer, sessionCompletionBonus } from "@/lib/engine/scoring";
import { levelForPoints } from "@/lib/engine/leveling";
import { soundManager } from "@/lib/sound/soundManager";

const BEAT_CLOCK_SECONDS = 60;
const FEEDBACK_DELAY_CORRECT = 650;
const FEEDBACK_DELAY_INCORRECT = 1500;
const FEEDBACK_DELAY_CORRECT_FAST = 350;
const FEEDBACK_DELAY_INCORRECT_FAST = 800;

export interface UseGameSessionArgs {
  profile: ChildProfile;
  mode: GameMode;
  tables: number[];
  questionCount: number;
  weakFactPool?: Array<{ a: number; b: number }>;
}

type Feedback = "none" | "correct" | "incorrect";

export interface GameSessionState {
  phase: "loading" | "playing" | "finished";
  question: Question | null;
  typed: string;
  selectedChoice: number | null;
  feedback: Feedback;
  streak: number;
  bestStreakInSession: number;
  correctCount: number;
  totalAnswered: number;
  pointsEarned: number;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number | null;
  summary: SessionSummary | null;
  isNewStreakRecord: boolean;
  isNewBeatClockRecord: boolean;
  leveledUpTo: number | null;
  lastPointsAwarded: number;
}

export interface GameSessionActions {
  setDigit: (digit: string) => void;
  backspace: () => void;
  submitTyped: () => void;
  selectChoice: (value: number) => void;
  quit: () => void;
}

const isEndless = (mode: GameMode) => mode === "beatclock" || mode === "streak";

export function useGameSession(
  args: UseGameSessionArgs,
): [GameSessionState, GameSessionActions] {
  const { profile, mode, tables, questionCount, weakFactPool } = args;
  const store = getStore();

  const sessionIdRef = useRef(crypto.randomUUID());
  const masteryRef = useRef<Record<string, FactMastery>>({});
  const recentIdsRef = useRef<string[]>([]);
  const lastRevealedFactRef = useRef<string | null>(null);
  const questionStartRef = useRef<number>(0);
  const pointsAccumRef = useRef(0);
  const correctAccumRef = useRef(0);
  const totalAccumRef = useRef(0);
  const bestStreakRef = useRef(0);
  const streakRef = useRef(0);
  const finishedRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pairs = useMemo(() => {
    if (mode === "tryagain" && weakFactPool) return weakFactPool;
    return buildFactPairs({ tables, multiplierMax: 10 });
  }, [mode, tables, weakFactPool]);

  const [state, setState] = useState<GameSessionState>({
    phase: "loading",
    question: null,
    typed: "",
    selectedChoice: null,
    feedback: "none",
    streak: 0,
    bestStreakInSession: 0,
    correctCount: 0,
    totalAnswered: 0,
    pointsEarned: 0,
    questionIndex: 0,
    totalQuestions: isEndless(mode) ? 0 : questionCount,
    timeRemaining: mode === "beatclock" ? BEAT_CLOCK_SECONDS : null,
    summary: null,
    isNewStreakRecord: false,
    isNewBeatClockRecord: false,
    leveledUpTo: null,
    lastPointsAwarded: 0,
  });

  const nextQuestion = useCallback(() => {
    if (pairs.length === 0) {
      setState((s) => ({ ...s, phase: "finished" }));
      return;
    }
    const masteryMap = masteryRef.current;
    const canonicalMap: Record<string, FactMastery | undefined> = {};
    for (const [k, v] of Object.entries(masteryMap)) canonicalMap[k] = v;

    const pair = selectNextFact(pairs, canonicalMap, recentIdsRef.current);
    const questionMode: GameMode = mode === "tryagain" ? "recall" : mode;
    const q = generateQuestion(questionMode, pair, Math.random);
    recentIdsRef.current = [...recentIdsRef.current, canonicalFactId(pair.a, pair.b)].slice(-6);
    questionStartRef.current = performance.now();
    setState((s) => ({
      ...s,
      question: q,
      typed: "",
      selectedChoice: null,
      feedback: "none",
      phase: "playing",
    }));
  }, [mode, pairs]);

  // Load mastery once, then start.
  useEffect(() => {
    let active = true;
    (async () => {
      const map = await store.getMasteryMap(profile.id);
      if (!active) return;
      masteryRef.current = map;
      const session: SessionSummary = {
        id: sessionIdRef.current,
        profileId: profile.id,
        mode,
        tables,
        startedAt: new Date().toISOString(),
        endedAt: null,
        totalQuestions: 0,
        correctCount: 0,
        pointsEarned: 0,
        bestStreakInSession: 0,
      };
      await store.createSession(session);
      nextQuestion();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    const priorLevel = levelForPoints(profile.points);
    const isNewStreakRecord = bestStreakRef.current > profile.bests.longestStreak;
    const isNewBeatClockRecord =
      mode === "beatclock" && correctAccumRef.current > profile.bests.beatClockScore;

    await store.updateSession({
      id: sessionIdRef.current,
      profileId: profile.id,
      mode,
      tables,
      startedAt: state.summary?.startedAt ?? new Date().toISOString(),
      endedAt: new Date().toISOString(),
      totalQuestions: totalAccumRef.current,
      correctCount: correctAccumRef.current,
      pointsEarned: pointsAccumRef.current,
      bestStreakInSession: bestStreakRef.current,
    });

    const newBests = {
      longestStreak: Math.max(profile.bests.longestStreak, bestStreakRef.current),
      beatClockScore: Math.max(
        profile.bests.beatClockScore,
        mode === "beatclock" ? correctAccumRef.current : 0,
      ),
    };

    let newTotalPoints: number;
    if (store.backend === "supabase") {
      // The server already applied per-answer points (apply_attempt) and
      // the session-completion bonus (finish_session above) — re-fetch
      // rather than trust a client-computed total here.
      const authoritative = await store.getProfile(profile.id);
      newTotalPoints = authoritative?.points ?? profile.points;
      await store.saveProfile({
        ...(authoritative ?? profile),
        lastTables: tables,
        bests: newBests,
      });
    } else {
      // Local demo mode: this client *is* the only authority, so compute
      // and persist the session-completion bonus here.
      const bonus = totalAccumRef.current > 0 ? sessionCompletionBonus() : 0;
      newTotalPoints = profile.points + pointsAccumRef.current + bonus;
      await store.saveProfile({
        ...profile,
        points: newTotalPoints,
        lastTables: tables,
        bests: newBests,
      });
    }

    const finalPoints = newTotalPoints - profile.points;
    const newLevel = levelForPoints(newTotalPoints);

    soundManager.play("complete");
    if (isNewStreakRecord || isNewBeatClockRecord) soundManager.play("record");
    if (newLevel > priorLevel) soundManager.play("levelup");

    setState((s) => ({
      ...s,
      phase: "finished",
      pointsEarned: finalPoints,
      isNewStreakRecord,
      isNewBeatClockRecord,
      leveledUpTo: newLevel > priorLevel ? newLevel : null,
      summary: {
        id: sessionIdRef.current,
        profileId: profile.id,
        mode,
        tables,
        startedAt: s.summary?.startedAt ?? new Date().toISOString(),
        endedAt: new Date().toISOString(),
        totalQuestions: totalAccumRef.current,
        correctCount: correctAccumRef.current,
        pointsEarned: finalPoints,
        bestStreakInSession: bestStreakRef.current,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, profile, tables, store]);

  // Beat-the-clock countdown.
  useEffect(() => {
    if (mode !== "beatclock" || state.phase !== "playing") return;
    const interval = setInterval(() => {
      setState((s) => {
        if (s.timeRemaining === null) return s;
        const next = s.timeRemaining - 1;
        if (next <= 0) {
          clearInterval(interval);
          finish();
          return { ...s, timeRemaining: 0 };
        }
        return { ...s, timeRemaining: next };
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state.phase === "playing"]);

  const answer = useCallback(
    async (userAnswer: number | null, independentOverride?: boolean) => {
      const q = state.question;
      if (!q || state.phase !== "playing") return;

      const expected = expectedInputAnswer(q);
      const correct = userAnswer !== null && userAnswer === expected;
      const independent = independentOverride ?? isIndependentMode(mode);
      const cid = canonicalFactId(q.a, q.b);
      const isRetry = lastRevealedFactRef.current === cid;

      const responseTimeMs = Math.round(performance.now() - questionStartRef.current);

      const newStreak = correct ? streakRef.current + 1 : 0;
      const result = scoreAnswer({
        correct,
        independent,
        isRetryAfterReveal: isRetry,
        streakAfterThisAnswer: newStreak,
      });

      streakRef.current = newStreak;
      bestStreakRef.current = Math.max(bestStreakRef.current, newStreak);
      totalAccumRef.current += 1;
      if (correct) correctAccumRef.current += 1;
      pointsAccumRef.current += result.totalPoints;
      lastRevealedFactRef.current = correct ? null : cid;

      const priorMastery = masteryRef.current[cid];
      const updatedMastery = recordAttempt(priorMastery, {
        canonicalFactId: cid,
        sessionId: sessionIdRef.current,
        correct,
        independent,
        isRetryAfterReveal: isRetry,
      });
      masteryRef.current[cid] = updatedMastery;

      const attempt: AttemptRecord = {
        id: crypto.randomUUID(),
        sessionId: sessionIdRef.current,
        factId: cid,
        mode,
        missingSlot: q.missing,
        userAnswer,
        correct,
        independent,
        responseTimeMs,
        isRetryAfterReveal: isRetry,
        createdAt: new Date().toISOString(),
      };

      soundManager.play(correct ? "correct" : "incorrect");
      if (correct && newStreak > 0 && newStreak % 10 === 0) soundManager.play("streak10");
      else if (correct && newStreak > 0 && newStreak % 5 === 0) soundManager.play("streak5");

      setState((s) => ({
        ...s,
        selectedChoice: independent ? null : userAnswer,
        feedback: correct ? "correct" : "incorrect",
        streak: streakRef.current,
        bestStreakInSession: bestStreakRef.current,
        correctCount: correctAccumRef.current,
        totalAnswered: totalAccumRef.current,
        pointsEarned: pointsAccumRef.current,
        lastPointsAwarded: result.totalPoints,
        questionIndex: s.questionIndex + 1,
      }));

      await Promise.all([store.addAttempt(attempt), store.saveMastery(profile.id, updatedMastery)]);

      const fast = mode === "beatclock";
      const delay = correct
        ? fast
          ? FEEDBACK_DELAY_CORRECT_FAST
          : FEEDBACK_DELAY_CORRECT
        : fast
          ? FEEDBACK_DELAY_INCORRECT_FAST
          : FEEDBACK_DELAY_INCORRECT;

      if (mode === "streak" && !correct) {
        advanceTimerRef.current = setTimeout(() => finish(), delay);
        return;
      }

      const reachedCount = !isEndless(mode) && totalAccumRef.current >= questionCount;
      advanceTimerRef.current = setTimeout(() => {
        if (finishedRef.current) return;
        if (reachedCount) finish();
        else nextQuestion();
      }, delay);
    },
    [mode, profile.id, questionCount, state.phase, state.question, store, finish, nextQuestion],
  );

  const actions: GameSessionActions = {
    setDigit: (digit) =>
      setState((s) => (s.typed.length >= 3 ? s : { ...s, typed: s.typed + digit })),
    backspace: () => setState((s) => ({ ...s, typed: s.typed.slice(0, -1) })),
    submitTyped: () => {
      if (state.typed.length === 0 || state.feedback !== "none") return;
      answer(Number(state.typed), true);
    },
    selectChoice: (value) => {
      if (state.feedback !== "none") return;
      answer(value, false);
    },
    quit: () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      finish();
    },
  };

  return [state, actions];
}
