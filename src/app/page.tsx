"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useProfiles } from "@/context/ProfileContext";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { soundManager } from "@/lib/sound/soundManager";

function Blob({ color, className }: { color: string; className: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-40 ${className}`}
      style={{ background: color }}
      aria-hidden
    />
  );
}

export default function WelcomePage() {
  const { currentProfile, loading } = useProfiles();

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6 py-12">
      <Blob color="#8b5cf6" className="w-72 h-72 -top-10 -left-16" />
      <Blob color="#2dd4a7" className="w-80 h-80 top-1/3 -right-20" />
      <Blob color="#facc15" className="w-64 h-64 bottom-0 left-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="h-16 w-16 rounded-3xl bg-purple shadow-pop flex items-center justify-center">
            <Sparkles className="text-white" size={32} />
          </div>
        </div>

        <h1 className="font-display text-5xl font-extrabold tracking-tight mb-3">
          MULTIPLY
        </h1>
        <p className="text-ink-soft text-lg font-semibold mb-10">
          Practice your times tables. Earn points. Beat your own record.
        </p>

        {!loading && currentProfile && (
          <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl shadow-pop-sm px-4 py-3">
            <Avatar avatar={currentProfile.avatar} size={40} />
            <span className="font-display font-bold">Continue as {currentProfile.name}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {!loading && currentProfile ? (
            <Link href="/home" className="w-full">
              <Button
                accentColor="purple"
                size="lg"
                fullWidth
                onClick={() => soundManager.unlock()}
              >
                Let&apos;s Play
              </Button>
            </Link>
          ) : (
            <Link href="/profiles" className="w-full">
              <Button
                accentColor="purple"
                size="lg"
                fullWidth
                onClick={() => soundManager.unlock()}
              >
                Get Started
              </Button>
            </Link>
          )}
          {!loading && currentProfile && (
            <Link href="/profiles" className="w-full">
              <Button accentColor="purple" variant="soft" size="md" fullWidth>
                Switch Player
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </main>
  );
}
