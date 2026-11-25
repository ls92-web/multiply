"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Panel } from "@/components/ui/Panel";
import { MasteryGrid } from "@/components/game/MasteryGrid";
import { useProfiles } from "@/context/ProfileContext";
import { getStore } from "@/lib/store";
import { AttemptRecord, FactMastery } from "@/lib/types";
import { canonicalFactId } from "@/lib/engine/facts";
import { levelProgress } from "@/lib/engine/leveling";

export default function ProgressPage() {
  const router = useRouter();
  const { currentProfile, loading } = useProfiles();
  const [mastery, setMastery] = useState<Record<string, FactMastery> | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null);

  useEffect(() => {
    if (!loading && !currentProfile) router.replace("/profiles");
  }, [loading, currentProfile, router]);

  useEffect(() => {
    if (!currentProfile) return;
    const store = getStore();
    store.getMasteryMap(currentProfile.id).then(setMastery);
    store.getAttempts(currentProfile.id).then(setAttempts);
  }, [currentProfile]);

  const stats = useMemo(() => {
    if (!attempts) return null;
    const total = attempts.length;
    const correct = attempts.filter((a) => a.correct).length;
    const independentAttempts = attempts.filter((a) => a.independent);
    const independentCorrect = independentAttempts.filter((a) => a.correct).length;
    return {
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      independentAccuracy:
        independentAttempts.length > 0
          ? Math.round((independentCorrect / independentAttempts.length) * 100)
          : 0,
    };
  }, [attempts]);

  const tableBreakdown = useMemo(() => {
    if (!mastery) return null;
    const mastered: number[] = [];
    const needsPractice: number[] = [];
    for (let table = 1; table <= 12; table++) {
      const facts = Array.from({ length: 10 }, (_, i) => mastery[canonicalFactId(table, i + 1)]);
      const seen = facts.filter(Boolean);
      if (seen.length === 10 && seen.every((f) => f!.mastery === "mastered")) {
        mastered.push(table);
      } else if (seen.some((f) => f!.needsPractice)) {
        needsPractice.push(table);
      }
    }
    return { mastered, needsPractice };
  }, [mastery]);

  if (loading || !currentProfile) return <main className="flex-1" />;

  const progress = levelProgress(currentProfile.points);

  return (
    <main className="flex-1 flex flex-col">
      <TopBar backHref="/home" title="My Progress" />
      <div className="flex-1 flex flex-col items-center px-6 pb-12 max-w-2xl w-full mx-auto gap-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <StatCard label="Level" value={progress.level} color="bg-purple" />
          <StatCard label="Questions answered" value={stats?.total ?? 0} color="bg-blue" />
          <StatCard label="Overall accuracy" value={`${stats?.accuracy ?? 0}%`} color="bg-mint" />
          <StatCard
            label="Independent accuracy"
            value={`${stats?.independentAccuracy ?? 0}%`}
            color="bg-orange"
          />
          <StatCard label="Best streak" value={currentProfile.bests.longestStreak} color="bg-pink" />
          <StatCard
            label="Beat the Clock best"
            value={currentProfile.bests.beatClockScore}
            color="bg-yellow"
          />
          <StatCard label="Tables mastered" value={tableBreakdown?.mastered.length ?? 0} color="bg-mint" />
          <StatCard
            label="Tables to practice"
            value={tableBreakdown?.needsPractice.length ?? 0}
            color="bg-orange"
          />
        </div>

        <Panel className="w-full">
          <h2 className="font-display font-bold text-lg mb-1">Multiplication Mastery</h2>
          <p className="text-xs text-ink-soft font-semibold mb-4">
            Green means mastered, blue is developing, yellow is still learning, gray is new.
          </p>
          {mastery && <MasteryGrid mastery={mastery} />}
        </Panel>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-pop-sm p-4 flex flex-col gap-1">
      <span className={`h-2 w-10 rounded-full ${color}`} />
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-bold text-ink-soft">{label}</p>
    </div>
  );
}
