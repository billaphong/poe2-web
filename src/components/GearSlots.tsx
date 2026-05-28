"use client";

import type { ItemData } from "@/types/build";

interface GearSlotsProps {
  items: ItemData[] | null;
}

// 3-col paperdoll layout matching PoE2 character screen
const GRID_ROWS = [
  [null,       "Helmet",      null],
  ["Weapon 1", "Body Armour", "Weapon 2"],
  ["Ring 1",   "Amulet",      "Ring 2"],
  ["Gloves",   "Belt",        "Boots"],
];

const SLOT_LABELS: Record<string, string> = {
  Helmet: "Helm", "Weapon 1": "Weapon", "Body Armour": "Body",
  "Weapon 2": "Offhand", "Ring 1": "Ring L", Amulet: "Amulet",
  "Ring 2": "Ring R", Gloves: "Gloves", Belt: "Belt", Boots: "Boots",
};

const RARITY_COLOR: Record<string, string> = {
  NORMAL: "var(--fg-tertiary)",
  MAGIC:  "var(--rarity-magic)",
  RARE:   "var(--rarity-rare)",
  UNIQUE: "var(--rarity-unique)",
};

function parseMods(raw: string): { implicits: string[]; explicits: string[] } {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const implIdx = lines.findIndex((l) => l.startsWith("Implicits:"));
  if (implIdx === -1) return { implicits: [], explicits: [] };
  const count = parseInt(lines[implIdx].replace("Implicits:", "").trim(), 10) || 0;
  return {
    implicits: lines.slice(implIdx + 1, implIdx + 1 + count),
    explicits: lines.slice(implIdx + 1 + count),
  };
}

function SlotCard({ slot, item }: { slot: string; item?: ItemData }) {
  const rarity = item?.rarity ?? "NORMAL";
  const nameColor = RARITY_COLOR[rarity] ?? "var(--fg-tertiary)";
  const { implicits, explicits } = item?.raw ? parseMods(item.raw) : { implicits: [], explicits: [] };
  const hasItem = !!item?.name;

  return (
    <div style={{
      background: hasItem ? "var(--bg-raised)" : "var(--bg-surface)",
      border: `1px solid ${hasItem ? "var(--bg-border)" : "var(--bg-divider)"}`,
      borderRadius: "var(--r-md)",
      padding: "8px 10px",
      minHeight: 56,
      transition: "border-color 0.1s",
    }}
    onMouseEnter={(e) => hasItem && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-dim)")}
    onMouseLeave={(e) => hasItem && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--bg-border)")}
    >
      {/* Slot label */}
      <div style={{
        fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase" as const,
        fontWeight: 600, color: "var(--fg-faint)", marginBottom: 4,
      }}>
        {SLOT_LABELS[slot] ?? slot}
      </div>

      {hasItem ? (
        <>
          {/* Item name */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: nameColor,
            lineHeight: 1.35, marginBottom: 2,
          }}>
            {item!.name}
          </div>

          {/* Base type */}
          {item!.baseName && item!.baseName !== item!.name && (
            <div style={{ fontSize: 10, color: "var(--fg-muted)", lineHeight: 1.3, marginBottom: 5 }}>
              {item!.baseName}
            </div>
          )}

          {/* Divider before mods */}
          {(implicits.length > 0 || explicits.length > 0) && (
            <div style={{ height: 1, background: "var(--bg-border)", margin: "5px 0" }} />
          )}

          {/* Implicits */}
          {implicits.map((mod, i) => (
            <div key={`imp-${i}`} style={{
              fontSize: 10.5, color: "oklch(0.74 0.08 200)", lineHeight: 1.4,
            }}>
              {mod}
            </div>
          ))}

          {/* Divider between implicit/explicit */}
          {implicits.length > 0 && explicits.length > 0 && (
            <div style={{ height: 1, background: "var(--bg-divider)", margin: "4px 0" }} />
          )}

          {/* Explicits */}
          {explicits.map((mod, i) => (
            <div key={`exp-${i}`} style={{
              fontSize: 10.5, color: "var(--fg-secondary)", lineHeight: 1.4,
            }}>
              {mod}
            </div>
          ))}
        </>
      ) : (
        <div style={{ fontSize: 10.5, color: "var(--fg-faint)", fontStyle: "italic" }}>Empty</div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%", overflowY: "auto" }}>
      {GRID_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
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
  );
}
