"use client";

import type { ItemData } from "@/types/build";

interface GearSlotsProps {
  items: ItemData[] | null;
}

const SLOT_LAYOUT = [
  [null, "Helmet", null],
  ["Weapon 1", "Body Armour", "Weapon 2"],
  ["Ring 1", "Amulet", "Ring 2"],
  ["Gloves", "Belt", "Boots"],
];

const SLOT_LABELS: Record<string, string> = {
  Helmet: "Helm",
  "Weapon 1": "Weapon",
  "Body Armour": "Body",
  "Weapon 2": "Offhand",
  "Ring 1": "Ring L",
  Amulet: "Amulet",
  "Ring 2": "Ring R",
  Gloves: "Gloves",
  Belt: "Belt",
  Boots: "Boots",
};

const RARITY_LABEL_COLORS: Record<string, string> = {
  NORMAL: "text-gray-300",
  MAGIC: "text-blue-400",
  RARE: "text-yellow-400",
  UNIQUE: "text-orange-400",
};

/** Parse PoB raw item text into display lines (mods only, no metadata). */
function parseMods(raw: string): { implicits: string[]; explicits: string[] } {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

  let implicits: string[] = [];
  let explicits: string[] = [];

  // Find the "Implicits: N" line — mods start after it
  const implIdx = lines.findIndex(l => l.startsWith("Implicits:"));
  if (implIdx === -1) return { implicits: [], explicits: [] };

  const implCount = parseInt(lines[implIdx].replace("Implicits:", "").trim(), 10) || 0;
  const modsStart = implIdx + 1;
  implicits = lines.slice(modsStart, modsStart + implCount);
  explicits = lines.slice(modsStart + implCount);

  return { implicits, explicits };
}

function SlotCard({ slot, item }: { slot: string; item?: ItemData }) {
  const rarity = item?.rarity ?? "NORMAL";
  const nameColor = RARITY_LABEL_COLORS[rarity] ?? "text-gray-300";
  const { implicits, explicits } = item?.raw ? parseMods(item.raw) : { implicits: [], explicits: [] };
  const allMods = [...implicits, ...explicits];

  return (
    <div className="flex flex-col p-2 bg-gray-800 rounded border border-gray-700 min-h-[64px] hover:border-gray-500 transition-colors">
      <div className="text-xs text-gray-500 mb-1">{SLOT_LABELS[slot] ?? slot}</div>
      {item?.name ? (
        <>
          <div className={`text-xs font-semibold leading-snug ${nameColor} mb-1`}>
            {item.name}
          </div>
          {item.baseName && item.baseName !== item.name && (
            <div className="text-xs text-gray-500 leading-tight mb-1">{item.baseName}</div>
          )}
          {allMods.length > 0 && (
            <ul className="mt-0.5 space-y-0.5">
              {allMods.map((mod, i) => (
                <li key={i} className="text-xs text-gray-300 leading-tight">{mod}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="text-xs text-gray-600 italic mt-auto">Empty</div>
      )}
    </div>
  );
}

export default function GearSlots({ items }: GearSlotsProps) {
  const slotMap = new Map<string, ItemData>();
  if (items) {
    for (const item of items) {
      if (item.slot && item.name) slotMap.set(item.slot, item);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Equipment</div>
      <div className="flex flex-col gap-2">
        {SLOT_LAYOUT.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-2">
            {row.map((slot, ci) =>
              slot ? (
                <SlotCard key={slot} slot={slot} item={slotMap.get(slot)} />
              ) : (
                <div key={ci} />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
