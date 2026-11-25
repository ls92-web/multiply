"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useProfiles } from "@/context/ProfileContext";
import { TopBar } from "@/components/layout/TopBar";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TableSelector } from "@/components/game/TableSelector";
import { GamePlaySession } from "@/components/game/GamePlaySession";
import { GAME_MODES, GameMode } from "@/lib/types";
import { MODE_ICONS, MODE_INFO } from "@/lib/modes";
import { accent } from "@/lib/accent";
import { getStore } from "@/lib/store";
import { getWeakFactPairs } from "@/lib/gameplay/weakFacts";
import { soundManager } from "@/lib/sound/soundManager";

const QUESTION_COUNTS = [10, 20, 30];

export default function PlayModePage() {
  const params = useParams<{ mode: string }>();
  const router = useRouter();
  const { currentProfile, loading } = useProfiles();

  const mode = params.mode as GameMode;
  const isValidMode = GAME_MODES.includes(mode);

  useEffect(() => {
    if (!loading && !currentProfile) router.replace("/profiles");
  }, [loading, currentProfile, router]);

  useEffect(() => {
    if (!isValidMode) router.replace("/home");
  }, [isValidMode, router]);

  const [phase, setPhase] = useState<"setup" | "playing">("setup");
  const [tables, setTables] = useState<number[]>([1, 2, 3, 4, 5]);
  const [tablesLoadedFor, setTablesLoadedFor] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [weakFactPool, setWeakFactPool] = useState<Array<{ a: number; b: number }> | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  // Adjust `tables` to the profile's last-used selection the first time
  // that profile's data becomes available (render-time state adjustment,
  // not an effect, so it can't fight with the user's own later edits).
  if (currentProfile && tablesLoadedFor !== currentProfile.id) {
    setTablesLoadedFor(currentProfile.id);
    if (currentProfile.lastTables.length > 0) setTables(currentProfile.lastTables);
  }

  useEffect(() => {
    if (!currentProfile || mode !== "tryagain") return;
    let active = true;
    getStore()
      .getMasteryMap(currentProfile.id)
      .then((map) => {
        if (active) setWeakFactPool(getWeakFactPairs(map));
      });
    return () => {
      active = false;
    };
  }, [currentProfile, mode]);

  if (loading || !currentProfile || !isValidMode) {
    return <main className="flex-1" />;
  }

  const info = MODE_INFO[mode];
  const Icon = MODE_ICONS[mode];
  const a = accent(info.accent);
  const needsTables = mode !== "tryagain";
  const needsQuestionCount = !["beatclock", "streak", "tryagain"].includes(mode);

  const start = async () => {
    soundManager.unlock();
    soundManager.play("click");
    if (needsTables) {
      await getStore().saveProfile({ ...currentProfile, lastTables: tables });
    }
    setSessionKey((k) => k + 1);
    setPhase("playing");
  };

  if (phase === "playing") {
    const pool = mode === "tryagain" ? weakFactPool ?? [] : undefined;
    if (mode === "tryagain" && pool && pool.length === 0) {
      return (
        <main className="flex-1 flex flex-col">
          <TopBar backHref="/home" title={info.name} />
          <EmptyWeakFacts accentColorText={a.text} onHome={() => router.push("/home")} />
        </main>
      );
    }
    return (
      <main className="flex-1 flex flex-col">
        <TopBar backHref="/home" title={info.name} />
        <GamePlaySession
          key={sessionKey}
          profile={currentProfile}
          mode={mode}
          tables={tables}
          questionCount={mode === "tryagain" ? Math.min(10, pool?.length ?? 10) : questionCount}
          weakFactPool={pool}
          onPlayAgain={() => setSessionKey((k) => k + 1)}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <TopBar backHref="/home" title={info.name} />
      <div className="flex-1 flex flex-col items-center px-6 pb-10 max-w-md w-full mx-auto">
        <Panel className="w-full flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className={clsx("h-12 w-12 rounded-2xl flex items-center justify-center", a.bg)}>
              <Icon className="text-white" size={24} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">{info.name}</h2>
              <p className="text-sm text-ink-soft font-semibold">{info.tagline}</p>
            </div>
          </div>

          {needsTables && (
            <TableSelector selected={tables} onChange={setTables} accentColor={info.accent} />
          )}

          {needsQuestionCount && (
            <div>
              <p className="font-display font-bold text-sm text-ink-soft mb-3">
                How many questions?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {QUESTION_COUNTS.map((count) => (
                  <motion.button
                    key={count}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setQuestionCount(count)}
                    className={clsx(
                      "h-12 rounded-2xl font-display font-bold",
                      questionCount === count ? clsx(a.bg, "text-white") : "bg-cream text-ink-soft",
                    )}
                  >
                    {count}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {mode === "beatclock" && (
            <p className="text-sm text-ink-soft font-semibold text-center">
              Answer as many as you can in 60 seconds.
            </p>
          )}
          {mode === "streak" && (
            <p className="text-sm text-ink-soft font-semibold text-center">
              Keep going until you miss one. Can you beat your record?
            </p>
          )}
          {mode === "tryagain" && (
            <p className="text-sm text-ink-soft font-semibold text-center">
              {weakFactPool === null
                ? "Checking your tricky facts..."
                : `${weakFactPool.length} fact${weakFactPool.length === 1 ? "" : "s"} ready for review.`}
            </p>
          )}

          <Button
            accentColor={info.accent}
            size="lg"
            fullWidth
            disabled={needsTables && tables.length === 0}
            onClick={start}
          >
            Start
          </Button>
        </Panel>
      </div>
    </main>
  );
}

function EmptyWeakFacts({
  accentColorText,
  onHome,
}: {
  accentColorText: string;
  onHome: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className={clsx("font-display text-2xl font-bold", accentColorText)}>
        Nothing to review right now!
      </p>
      <p className="text-ink-soft font-semibold max-w-xs">
        Great job — you don&apos;t have any tricky facts waiting. Keep practicing other modes and
        we&apos;ll bring facts here if you need more practice.
      </p>
      <Button accentColor="purple" onClick={onHome}>
        Back to Hub
      </Button>
    </div>
  );
}
