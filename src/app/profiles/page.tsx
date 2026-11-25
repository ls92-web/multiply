"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, Camera, X } from "lucide-react";
import clsx from "clsx";
import { useProfiles } from "@/context/ProfileContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { AccentColor, CharacterId } from "@/lib/types";
import { ACCENT_HEX } from "@/lib/accent";
import { CHARACTERS } from "@/lib/characters";
import { fileToSquareDataUrl } from "@/lib/image";
import { soundManager } from "@/lib/sound/soundManager";

const COLORS: AccentColor[] = ["purple", "blue", "orange", "pink", "mint", "yellow"];

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, selectProfile, createProfile, deleteProfile, loading } = useProfiles();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<AccentColor>("purple");
  const [character, setCharacter] = useState<CharacterId>(CHARACTERS[0].id);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const choose = (id: string) => {
    soundManager.unlock();
    soundManager.play("click");
    selectProfile(id);
    router.push("/home");
  };

  const resetForm = () => {
    setName("");
    setColor("purple");
    setCharacter(CHARACTERS[0].id);
    setPhotoDataUrl(null);
    setPhotoError(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const profile = await createProfile(name, { color, character, photoDataUrl });
    setCreating(false);
    resetForm();
    choose(profile.id);
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPhotoError(null);
      const dataUrl = await fileToSquareDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch {
      setPhotoError("Couldn't use that photo. Please try another.");
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Who&apos;s playing?</h1>
      <p className="text-ink-soft font-semibold mb-8">Pick a player or add a new one</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-xl mb-6">
        {!loading &&
          profiles.map((profile) => (
            <motion.div
              key={profile.id}
              whileTap={{ scale: 0.96 }}
              className="relative bg-white rounded-3xl shadow-pop p-4 flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => choose(profile.id)}
            >
              <Avatar avatar={profile.avatar} size={64} />
              <span className="font-display font-bold text-center break-words max-w-full">
                {profile.name}
              </span>
              <span className="text-xs text-ink-soft font-semibold">{profile.points} pts</span>
              <button
                aria-label={`Remove ${profile.name}`}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-cream flex items-center justify-center text-ink-soft"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(profile.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setCreating(true)}
          className="bg-white/60 border-2 border-dashed border-ink/20 rounded-3xl flex flex-col items-center justify-center gap-2 p-4 min-h-[148px] text-ink-soft"
        >
          <Plus size={28} />
          <span className="font-display font-bold">Add Player</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40 overflow-y-auto"
            onClick={() => setCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="my-8"
            >
              <Panel className="w-full max-w-sm">
                <h2 className="font-display text-xl font-bold mb-4">New Player</h2>

                <div className="flex flex-col items-center gap-3 mb-4">
                  <Avatar avatar={{ color, character, photoDataUrl }} size={88} />
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handlePhotoSelected}
                    />
                    <Button
                      variant="soft"
                      accentColor={color}
                      size="sm"
                      icon={<Camera size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {photoDataUrl ? "Change Photo" : "Add Photo"}
                    </Button>
                    {photoDataUrl && (
                      <Button
                        variant="ghost"
                        accentColor="pink"
                        size="sm"
                        icon={<X size={16} />}
                        onClick={() => setPhotoDataUrl(null)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {photoError && <p className="text-xs text-error font-semibold">{photoError}</p>}
                </div>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Player name"
                  maxLength={24}
                  className="w-full rounded-2xl border-2 border-ink/10 px-4 py-3 font-semibold text-center mb-4 focus:outline-none focus:border-purple"
                  autoFocus
                />

                <p className="text-sm font-bold text-ink-soft mb-2">
                  Character{photoDataUrl && " (used if you remove the photo)"}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4 justify-items-center">
                  {CHARACTERS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCharacter(c.id)}
                      className={clsx(
                        "h-14 w-14 rounded-xl flex items-center justify-center bg-cream",
                        character === c.id && "ring-2 ring-offset-2 ring-purple",
                      )}
                      aria-label={c.label}
                    >
                      <Avatar avatar={{ color: "purple", character: c.id }} size={40} />
                    </button>
                  ))}
                </div>

                <p className="text-sm font-bold text-ink-soft mb-2">Color</p>
                <div className="flex gap-2 mb-6 justify-center">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={clsx(
                        "h-9 w-9 rounded-full flex items-center justify-center",
                        color === c && "ring-2 ring-offset-2 ring-ink/40",
                      )}
                      style={{ backgroundColor: ACCENT_HEX[c] }}
                      aria-label={c}
                    >
                      {color === c && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>

                <Button accentColor={color} fullWidth onClick={handleCreate} disabled={!name.trim()}>
                  Create Player
                </Button>
              </Panel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40"
            onClick={() => setConfirmDeleteId(null)}
          >
            <Panel className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
              <p className="font-display font-bold text-lg mb-1">Remove this player?</p>
              <p className="text-sm text-ink-soft font-semibold mb-5">
                Their points and progress will be deleted from this device.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="soft"
                  accentColor="purple"
                  fullWidth
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  accentColor="pink"
                  fullWidth
                  onClick={async () => {
                    await deleteProfile(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
