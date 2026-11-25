"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, LineChart } from "lucide-react";
import { useProfiles } from "@/context/ProfileContext";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Panel } from "@/components/ui/Panel";
import { levelProgress } from "@/lib/engine/leveling";
import { GAME_MODES } from "@/lib/types";
import { MODE_ICONS, MODE_INFO } from "@/lib/modes";
import { accent } from "@/lib/accent";

export default function HomePage() {
  const router = useRouter();
  const { currentProfile, loading } = useProfiles();

  useEffect(() => {
    if (!loading && !currentProfile) router.replace("/profiles");
  }, [loading, currentProfile, router]);

  if (loading || !currentProfile) {
    return <main className="flex-1" />;
  }

  const progress = levelProgress(currentProfile.points);

  return (
    <main className="flex-1 flex flex-col">
      <TopBar />

      <div className="flex-1 flex flex-col items-center px-6 pb-12 max-w-3xl w-full mx-auto">
        <Panel className="w-full flex items-center gap-4 mb-6">
          <Avatar avatar={currentProfile.avatar} size={72} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold truncate">{currentProfile.name}</h1>
            <p className="text-ink-soft font-semibold text-sm mb-2">
              Level {progress.level} &middot; {currentProfile.points} points
            </p>
            <ProgressBar ratio={progress.progressRatio} accentColor="purple" height={12} />
            <p className="text-xs text-ink-soft font-semibold mt-1">
              {progress.pointsForNextLevel - progress.pointsIntoLevel} points to level{" "}
              {progress.level + 1}
            </p>
          </div>
        </Panel>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full mb-6">
          {GAME_MODES.map((mode, i) => {
            const info = MODE_INFO[mode];
            const Icon = MODE_ICONS[mode];
            const a = accent(info.accent);
            return (
              <Link href={`/play/${mode}`} key={mode}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-3xl shadow-pop p-5 flex flex-col gap-3 h-full min-h-[128px]"
                >
                  <span
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center ${a.bg}`}
                  >
                    <Icon className="text-white" size={22} />
                  </span>
                  <div>
                    <p className="font-display font-bold leading-tight">{info.name}</p>
                    <p className="text-xs text-ink-soft font-semibold mt-0.5">{info.tagline}</p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Link href="/leaderboard">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="bg-white rounded-3xl shadow-pop-sm p-4 flex items-center gap-3"
            >
              <Trophy className="text-yellow-deep" size={22} />
              <span className="font-display font-bold">Leaderboard</span>
            </motion.div>
          </Link>
          <Link href="/progress">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="bg-white rounded-3xl shadow-pop-sm p-4 flex items-center gap-3"
            >
              <LineChart className="text-mint-deep" size={22} />
              <span className="font-display font-bold">My Progress</span>
            </motion.div>
          </Link>
        </div>
      </div>
    </main>
  );
}
