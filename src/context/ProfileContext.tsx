"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { getStore, isDemoMode } from "@/lib/store";
import { AvatarConfig, ChildProfile } from "@/lib/types";
import { soundManager } from "@/lib/sound/soundManager";

const CURRENT_PROFILE_KEY = "multiply.currentProfileId";

interface ProfileContextValue {
  profiles: ChildProfile[];
  currentProfile: ChildProfile | null;
  loading: boolean;
  demoMode: boolean;
  refreshProfiles: () => Promise<void>;
  selectProfile: (id: string | null) => void;
  createProfile: (name: string, avatar: AvatarConfig) => Promise<ChildProfile>;
  deleteProfile: (id: string) => Promise<void>;
  updateCurrentProfile: (patch: Partial<ChildProfile>) => Promise<void>;
  toggleSound: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(CURRENT_PROFILE_KEY),
  );
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    const list = await getStore().listProfiles();
    setProfiles(list);
    return;
  }, []);

  useEffect(() => {
    // One-time fetch-on-mount from the local/Supabase store; there is no
    // external subscription to tie this to, so the standard effect+fetch
    // pattern is the correct tool here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProfiles().finally(() => setLoading(false));
  }, [refreshProfiles]);

  const pathname = usePathname();
  useEffect(() => {
    // Gameplay writes points/mastery straight to the store (not through this
    // context), so re-sync from the store on every navigation — e.g. when
    // returning from a game session to the home hub — rather than trusting
    // the in-memory copy.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProfiles();
  }, [pathname, refreshProfiles]);

  const currentProfile = useMemo(
    () => profiles.find((p) => p.id === currentProfileId) ?? null,
    [profiles, currentProfileId],
  );

  useEffect(() => {
    if (currentProfile) {
      soundManager.setMuted(!currentProfile.soundOn);
    }
  }, [currentProfile]);

  const selectProfile = useCallback((id: string | null) => {
    setCurrentProfileId(id);
    if (id) window.localStorage.setItem(CURRENT_PROFILE_KEY, id);
    else window.localStorage.removeItem(CURRENT_PROFILE_KEY);
  }, []);

  const createProfile = useCallback(
    async (name: string, avatar: AvatarConfig) => {
      const profile: ChildProfile = {
        id: crypto.randomUUID(),
        name: name.trim().slice(0, 24) || "Player",
        avatar,
        createdAt: new Date().toISOString(),
        points: 0,
        soundOn: true,
        lastTables: [1, 2, 3, 4, 5],
        bests: { longestStreak: 0, beatClockScore: 0 },
      };
      await getStore().saveProfile(profile);
      await refreshProfiles();
      return profile;
    },
    [refreshProfiles],
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      await getStore().deleteProfile(id);
      if (currentProfileId === id) selectProfile(null);
      await refreshProfiles();
    },
    [currentProfileId, refreshProfiles, selectProfile],
  );

  const updateCurrentProfile = useCallback(
    async (patch: Partial<ChildProfile>) => {
      if (!currentProfile) return;
      const updated = { ...currentProfile, ...patch };
      await getStore().saveProfile(updated);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    },
    [currentProfile],
  );

  const toggleSound = useCallback(async () => {
    if (!currentProfile) return;
    await updateCurrentProfile({ soundOn: !currentProfile.soundOn });
  }, [currentProfile, updateCurrentProfile]);

  const value: ProfileContextValue = {
    profiles,
    currentProfile,
    loading,
    demoMode: isDemoMode(),
    refreshProfiles,
    selectProfile,
    createProfile,
    deleteProfile,
    updateCurrentProfile,
    toggleSound,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfiles must be used within ProfileProvider");
  return ctx;
}
