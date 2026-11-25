import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("bg-white rounded-[1.75rem] shadow-pop p-6", className)}
      {...rest}
    />
  );
}
