"use client";

import type { ItemData } from "@/types/build";

interface GearSlotsProps {
  items: ItemData[] | null;
}

const SLOT_ORDER = [
  "Helm",
  "Amulet",
  "Weapon",
  "Body Armour",
  "Offhand",
  "Ring 1",
  "Gloves",
  "Ring 2",
  "Boots",
  "Belt",
];

const SLOT_LABELS: Record<string, string> = {
  Helm: "Helm",
  Amulet: "Amulet",
  Weapon: "Weapon",
  "Body Armour": "Body",
  Offhand: "Offhand",
  "Ring 1": "Ring L",
  Gloves: "Gloves",
  "Ring 2": "Ring R",
  Boots: "Boots",
  Belt: "Belt",
};

const RARITY_COLORS: Record<string, string> = {
  Normal: "text-gray-300",
  Magic: "text-blue-400",
  Rare: "text-yellow-400",
  Unique: "text-orange-400",
};

function SlotCard({ slot, item }: { slot: string; item?: ItemData }) {
  const rarity = item?.rarity ?? "Normal";
  const color = RARITY_COLORS[rarity] ?? "text-gray-300";

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-gray-800 rounded border border-gray-700 min-h-[64px] text-center cursor-default hover:border-gray-500 transition-colors">
      <div className="text-xs text-gray-500 mb-1">{SLOT_LABELS[slot] ?? slot}</div>
      {item ? (
        <>
          <div className={`text-xs font-semibold leading-tight ${color}`}>
            {item.name}
          </div>
          {item.base && item.base !== item.name && (
            <div className="text-xs text-gray-500 leading-tight">{item.base}</div>
          )}
        </>
      ) : (
        <div className="text-xs text-gray-600 italic">Empty</div>
      )}
    </div>
  );
}

export default function GearSlots({ items }: GearSlotsProps) {
  const slotMap = new Map<string, ItemData>();
  if (items) {
    for (const item of items) {
      if (item.slot) slotMap.set(item.slot, item);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Equipment</div>

      <div className="grid grid-cols-3 gap-2">
        <div />
        <SlotCard slot="Helm" item={slotMap.get("Helm")} />
        <div />

        <SlotCard slot="Weapon" item={slotMap.get("Weapon")} />
        <SlotCard slot="Body Armour" item={slotMap.get("Body Armour")} />
        <SlotCard slot="Offhand" item={slotMap.get("Offhand")} />

        <SlotCard slot="Ring 1" item={slotMap.get("Ring 1")} />
        <SlotCard slot="Amulet" item={slotMap.get("Amulet")} />
        <SlotCard slot="Ring 2" item={slotMap.get("Ring 2")} />

        <SlotCard slot="Gloves" item={slotMap.get("Gloves")} />
        <SlotCard slot="Belt" item={slotMap.get("Belt")} />
        <SlotCard slot="Boots" item={slotMap.get("Boots")} />
      </div>

      {items &&
        items
          .filter((item) => item.slot && !SLOT_ORDER.includes(item.slot))
          .map((item) => (
            <div key={item.slot ?? item.name} className="text-xs text-gray-400">
              {item.slot}: {item.name}
            </div>
          ))}
    </div>
  );
}
