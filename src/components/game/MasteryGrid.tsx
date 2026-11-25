"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { FactMastery } from "@/lib/types";
import { canonicalFactId } from "@/lib/engine/facts";

interface MasteryGridProps {
  mastery: Record<string, FactMastery>;
}

const CELL_CLASS: Record<string, string> = {
  new: "bg-ink/8 text-ink-soft",
  learning: "bg-yellow/70 text-yellow-deep",
  developing: "bg-blue/60 text-white",
  mastered: "bg-mint text-white",
};

export function MasteryGrid({ mastery }: MasteryGridProps) {
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);
  const multipliers = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `32px repeat(10, 32px)` }}>
        <div />
        {multipliers.map((m) => (
          <div key={m} className="text-xs font-bold text-ink-soft text-center">
            {m}
          </div>
        ))}
        {tables.map((table) => (
          <RowFragment key={table} table={table} multipliers={multipliers} mastery={mastery} />
        ))}
      </div>
    </div>
  );
}

function RowFragment({
  table,
  multipliers,
  mastery,
}: {
  table: number;
  multipliers: number[];
  mastery: Record<string, FactMastery>;
}) {
  return (
    <>
      <div className="text-xs font-bold text-ink-soft flex items-center justify-center">
        {table}
      </div>
      {multipliers.map((m) => {
        const cid = canonicalFactId(table, m);
        const state = mastery[cid]?.mastery ?? "new";
        return (
          <motion.div
            key={m}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
              CELL_CLASS[state],
            )}
            title={`${table} x ${m} — ${state}`}
          >
            {table * m}
          </motion.div>
        );
      })}
    </>
  );
}
