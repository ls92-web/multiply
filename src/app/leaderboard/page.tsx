"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Timer, Gem } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Panel } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { useProfiles } from "@/context/ProfileContext";
import { getStore } from "@/lib/store";
import { levelForPoints } from "@/lib/engine/leveling";
import { LeaderboardRow } from "@/lib/types";

export default function LeaderboardPage() {
  const { profiles, loading } = useProfiles();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    if (loading) return;
    let active = true;
    (async () => {
      const store = getStore();
      const computed = await Promise.all(
        profiles.map(async (profile) => {
          const mastery = await store.getMasteryMap(profile.id);
          const masteredCount = Object.values(mastery).filter(
            (m) => m.mastery === "mastered",
          ).length;
          const row: LeaderboardRow = {
            profileId: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            points: profile.points,
            level: levelForPoints(profile.points),
            longestStreak: profile.bests.longestStreak,
            beatClockScore: profile.bests.beatClockScore,
            masteredCount,
          };
          return row;
        }),
      );
      computed.sort((a, b) => b.points - a.points);
      if (active) setRows(computed);
    })();
    return () => {
      active = false;
    };
  }, [profiles, loading]);

  return (
    <main className="flex-1 flex flex-col">
      <TopBar backHref="/home" title="Leaderboard" />
      <div className="flex-1 flex flex-col items-center px-6 pb-10 max-w-lg w-full mx-auto gap-3">
        {rows === null && <div className="flex-1" />}
        {rows?.length === 0 && (
          <p className="text-ink-soft font-semibold mt-10">No players yet.</p>
        )}
        {rows?.map((row, i) => (
          <motion.div
            key={row.profileId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full"
          >
            <Panel className="flex items-center gap-4 p-4">
              <span className="font-display text-xl font-extrabold text-ink-soft w-6 text-center">
                {i + 1}
              </span>
              <Avatar avatar={row.avatar} size={48} />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold truncate">{row.name}</p>
                <p className="text-xs text-ink-soft font-semibold">
                  Level {row.level} &middot; {row.points} pts
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs font-bold text-ink-soft">
                <span className="flex items-center gap-1">
                  <Flame size={13} /> {row.longestStreak}
                </span>
                <span className="flex items-center gap-1">
                  <Timer size={13} /> {row.beatClockScore}
                </span>
                <span className="flex items-center gap-1">
                  <Gem size={13} /> {row.masteredCount}
                </span>
              </div>
              {i === 0 && row.points > 0 && (
                <Trophy className="text-yellow-deep" size={20} />
              )}
            </Panel>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
