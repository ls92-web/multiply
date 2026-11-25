"use client";

import { ProfileProvider } from "@/context/ProfileContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
