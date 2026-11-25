"use client";

import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useProfiles } from "@/context/ProfileContext";
import { soundManager } from "@/lib/sound/soundManager";

interface TopBarProps {
  backHref?: string;
  title?: string;
  showSound?: boolean;
  showSwitchPlayer?: boolean;
}

export function TopBar({
  backHref,
  title,
  showSound = true,
  showSwitchPlayer = true,
}: TopBarProps) {
  const { currentProfile, toggleSound } = useProfiles();

  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-5xl w-full mx-auto">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link href={backHref}>
            <motion.span
              whileTap={{ scale: 0.9 }}
              className="h-11 w-11 rounded-full bg-white shadow-pop-sm flex items-center justify-center text-ink-soft"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </motion.span>
          </Link>
        )}
        {title && <h1 className="font-display text-xl sm:text-2xl font-bold">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {showSound && currentProfile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              soundManager.unlock();
              toggleSound();
            }}
            className="h-11 w-11 rounded-full bg-white shadow-pop-sm flex items-center justify-center text-ink-soft"
            aria-label={currentProfile.soundOn ? "Mute sound" : "Unmute sound"}
          >
            {currentProfile.soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
        )}
        {showSwitchPlayer && (
          <Link href="/profiles">
            <motion.span
              whileTap={{ scale: 0.9 }}
              className="h-11 w-11 rounded-full bg-white shadow-pop-sm flex items-center justify-center text-ink-soft"
              aria-label="Switch player"
            >
              <Users size={20} />
            </motion.span>
          </Link>
        )}
      </div>
    </div>
  );
}
