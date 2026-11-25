"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import clsx from "clsx";
import { AccentColor } from "@/lib/types";
import { accent } from "@/lib/accent";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "className" | "children"> {
  accentColor?: AccentColor;
  variant?: "solid" | "soft" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2.5 text-sm gap-1.5 min-h-11",
  md: "px-6 py-3.5 text-base gap-2 min-h-12",
  lg: "px-8 py-5 text-lg gap-3 min-h-14",
};

export function Button({
  accentColor = "purple",
  variant = "solid",
  size = "md",
  fullWidth,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const a = accent(accentColor);

  const variantClasses =
    variant === "solid"
      ? clsx(a.bg, a.textOn, "shadow-pop-sm")
      : variant === "soft"
        ? clsx(a.soft, a.text)
        : variant === "outline"
          ? clsx("bg-white border-2 border-current", a.text)
          : clsx("bg-transparent", a.text);

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.94, y: 2 }}
      whileHover={disabled ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled}
      className={clsx(
        "font-display font-bold rounded-2xl inline-flex items-center justify-center",
        "select-none disabled:opacity-50 disabled:pointer-events-none",
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        variantClasses,
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}
