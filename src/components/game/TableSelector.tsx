"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { AccentColor } from "@/lib/types";
import { accent } from "@/lib/accent";
import { allTables } from "@/lib/engine/facts";

interface TableSelectorProps {
  selected: number[];
  onChange: (tables: number[]) => void;
  accentColor?: AccentColor;
}

export function TableSelector({ selected, onChange, accentColor = "purple" }: TableSelectorProps) {
  const a = accent(accentColor);
  const tables = allTables(12);
  const allSelected = selected.length === tables.length;

  const toggle = (table: number) => {
    if (selected.includes(table)) onChange(selected.filter((t) => t !== table));
    else onChange([...selected, table].sort((x, y) => x - y));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-bold text-sm text-ink-soft">Choose tables</p>
        <button
          onClick={() => onChange(allSelected ? [] : tables)}
          className={clsx("text-sm font-bold", a.text)}
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {tables.map((table) => {
          const active = selected.includes(table);
          return (
            <motion.button
              key={table}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(table)}
              className={clsx(
                "h-14 rounded-2xl font-display font-bold text-lg flex items-center justify-center",
                active ? clsx(a.bg, "text-white shadow-pop-sm") : "bg-cream text-ink-soft",
              )}
              aria-pressed={active}
            >
              {table}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
