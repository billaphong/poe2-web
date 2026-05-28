"use client";

import type { BuildStats, BuildInfo } from "@/types/build";

interface StatsPanelProps {
  info: BuildInfo | null;
  stats: BuildStats | null;
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number | undefined;
  color?: string;
}) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color ?? "text-white"}`}>
        {typeof value === "number" && !Number.isInteger(value)
          ? value.toFixed(1)
          : value}
      </span>
    </div>
  );
}

function ResistRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number | undefined;
  color: string;
}) {
  if (value === undefined) return null;
  const capped = value >= 75;
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className={`text-sm ${color}`}>{label}</span>
      <span
        className={`text-sm font-mono font-semibold ${
          value < 0 ? "text-red-400" : capped ? "text-yellow-300" : "text-white"
        }`}
      >
        {value}%{capped ? " ✓" : ""}
      </span>
    </div>
  );
}

export default function StatsPanel({ info, stats }: StatsPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700 min-w-[200px]">
      {info && (
        <div className="border-b border-gray-700 pb-3">
          <div className="text-yellow-400 font-bold text-sm truncate">{info.name}</div>
          <div className="text-gray-400 text-xs mt-0.5">
            {info.class}
            {info.ascendancy && info.ascendancy !== info.class
              ? ` / ${info.ascendancy}`
              : ""}
            {" · "}Lv {info.level}
          </div>
        </div>
      )}

      {stats ? (
        <>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Defences</div>
            <StatRow label="Life" value={stats.Life} color="text-red-400" />
            <StatRow label="Energy Shield" value={stats.EnergyShield} color="text-blue-300" />
            <StatRow label="Mana" value={stats.Mana} color="text-blue-400" />
            <StatRow label="Evasion" value={stats.Evasion} color="text-green-400" />
            <StatRow label="Armour" value={stats.Armour} color="text-orange-300" />
            <StatRow label="Life Regen" value={stats.LifeRegen} color="text-red-300" />
            <StatRow label="Mana Regen" value={stats.ManaRegen} color="text-blue-300" />
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Resistances</div>
            <ResistRow label="Fire" value={stats.FireResist} color="text-orange-400" />
            <ResistRow label="Cold" value={stats.ColdResist} color="text-cyan-400" />
            <ResistRow label="Lightning" value={stats.LightningResist} color="text-yellow-400" />
            <ResistRow label="Chaos" value={stats.ChaosResist} color="text-purple-400" />
          </div>

          {Object.keys(stats).some((k) => k.toLowerCase().includes("dps")) && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">DPS</div>
              {Object.entries(stats)
                .filter(([k]) => k.toLowerCase().includes("dps"))
                .map(([k, v]) => (
                  <StatRow key={k} label={k} value={v} color="text-emerald-400" />
                ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-500 text-sm text-center py-4">No build loaded</div>
      )}
    </div>
  );
}
