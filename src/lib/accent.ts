import { AccentColor } from "./types";

interface AccentClasses {
  bg: string;
  bgDeep: string;
  text: string;
  textOn: string;
  ring: string;
  soft: string;
}

const MAP: Record<AccentColor, AccentClasses> = {
  purple: {
    bg: "bg-purple",
    bgDeep: "bg-purple-deep",
    text: "text-purple-deep",
    textOn: "text-white",
    ring: "ring-purple",
    soft: "bg-purple/12",
  },
  blue: {
    bg: "bg-blue",
    bgDeep: "bg-blue-deep",
    text: "text-blue-deep",
    textOn: "text-white",
    ring: "ring-blue",
    soft: "bg-blue/12",
  },
  orange: {
    bg: "bg-orange",
    bgDeep: "bg-orange-deep",
    text: "text-orange-deep",
    textOn: "text-white",
    ring: "ring-orange",
    soft: "bg-orange/14",
  },
  pink: {
    bg: "bg-pink",
    bgDeep: "bg-pink-deep",
    text: "text-pink-deep",
    textOn: "text-white",
    ring: "ring-pink",
    soft: "bg-pink/12",
  },
  mint: {
    bg: "bg-mint",
    bgDeep: "bg-mint-deep",
    text: "text-mint-deep",
    textOn: "text-white",
    ring: "ring-mint",
    soft: "bg-mint/14",
  },
  yellow: {
    bg: "bg-yellow",
    bgDeep: "bg-yellow-deep",
    text: "text-yellow-deep",
    textOn: "text-ink",
    ring: "ring-yellow",
    soft: "bg-yellow/16",
  },
};

export function accent(color: AccentColor): AccentClasses {
  return MAP[color];
}

export const ACCENT_HEX: Record<AccentColor, string> = {
  purple: "#8b5cf6",
  blue: "#3b82f6",
  orange: "#fb923c",
  pink: "#ec4899",
  mint: "#2dd4a7",
  yellow: "#facc15",
};
