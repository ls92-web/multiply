import { AvatarConfig, CharacterId } from "@/lib/types";
import { ACCENT_HEX } from "@/lib/accent";

interface AvatarProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
}

const HAIR = "#3a2e55";

function Hair({ character }: { character: CharacterId }) {
  switch (character) {
    case "boy-short":
      return (
        <>
          <circle cx="50" cy="36" r="38" fill={HAIR} />
        </>
      );
    case "boy-spiky":
      return (
        <>
          <circle cx="50" cy="40" r="36" fill={HAIR} />
          <path
            d="M14 36 L22 14 L30 34 L40 10 L50 32 L60 10 L70 34 L78 14 L86 36 Z"
            fill={HAIR}
          />
        </>
      );
    case "boy-curly":
      return (
        <>
          <circle cx="50" cy="38" r="36" fill={HAIR} />
          <circle cx="20" cy="30" r="10" fill={HAIR} />
          <circle cx="37" cy="18" r="11" fill={HAIR} />
          <circle cx="63" cy="18" r="11" fill={HAIR} />
          <circle cx="80" cy="30" r="10" fill={HAIR} />
        </>
      );
    case "girl-ponytail":
      return (
        <>
          <circle cx="50" cy="36" r="37" fill={HAIR} />
          <path d="M64 14 Q90 2 96 22 Q98 34 80 32 Q66 28 64 14 Z" fill={HAIR} />
          <circle cx="68" cy="20" r="5" fill="white" fillOpacity="0.9" />
        </>
      );
    case "girl-pigtails":
      return (
        <>
          <circle cx="50" cy="36" r="37" fill={HAIR} />
          <ellipse cx="14" cy="52" rx="10" ry="14" fill={HAIR} />
          <ellipse cx="86" cy="52" rx="10" ry="14" fill={HAIR} />
        </>
      );
    case "girl-long":
      return (
        <>
          <circle cx="50" cy="34" r="38" fill={HAIR} />
          <path d="M8 40 Q4 70 14 86 Q22 88 22 74 Q16 58 20 40 Z" fill={HAIR} />
          <path d="M92 40 Q96 70 86 86 Q78 88 78 74 Q84 58 80 40 Z" fill={HAIR} />
        </>
      );
    default:
      return null;
  }
}

/** Illustrated character avatar, or a circular crop of an uploaded photo when one is set. */
export function Avatar({ avatar, size = 64, className }: AvatarProps) {
  const color = ACCENT_HEX[avatar.color];

  if (avatar.photoDataUrl) {
    return (
      <span
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          borderRadius: "9999px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, not an optimizable remote asset */}
        <img
          src={avatar.photoDataUrl}
          alt="Player photo"
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Player avatar"
    >
      <circle cx="50" cy="54" r="40" fill={color} />
      <Hair character={avatar.character} />
      <circle cx="37" cy="56" r="6" fill="white" />
      <circle cx="63" cy="56" r="6" fill="white" />
      <path
        d="M36 70 Q50 82 64 70"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <title>{`${avatar.character} avatar, ${avatar.color}`}</title>
    </svg>
  );
}
