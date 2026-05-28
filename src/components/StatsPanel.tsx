"use client";

import type { BuildStats, BuildInfo } from "@/types/build";

interface StatsPanelProps {
  info: BuildInfo | null;
  stats: BuildStats | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      fontWeight: 600,
      color: "var(--fg-muted)",
      marginBottom: 5,
      marginTop: 12,
    }}>
      {children}
    </div>
  );
}

function StatRow({ label, value, color, unit }: {
  label: string; value: number | undefined; color?: string; unit?: string;
}) {
  if (value === undefined || value === null) return null;
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: "2.5px 0", borderBottom: "1px solid var(--bg-divider)",
    }}>
      <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-geist-mono, var(--mono))", fontSize: 12, fontWeight: 500,
        letterSpacing: "-0.02em", color: color ?? "var(--fg-primary)",
      }}>
        {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value.toLocaleString()}
        {unit && <span style={{ fontSize: 9.5, color: "var(--fg-muted)", marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}

function ResistRow({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  if (value === undefined) return null;
  const capped = value >= 75;
  const negated = value < 0;
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: "2.5px 0", borderBottom: "1px solid var(--bg-divider)",
    }}>
      <span style={{ fontSize: 11, color }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-geist-mono, var(--mono))", fontSize: 12, fontWeight: 500,
        letterSpacing: "-0.02em",
        color: negated ? "var(--state-crit-fg)" : capped ? "var(--accent-base)" : "var(--fg-primary)",
      }}>
        {value}%{capped && <span style={{ fontSize: 9, marginLeft: 3, color: "var(--accent-dim)" }}>✓</span>}
      </span>
    </div>
  );
}

export default function StatsPanel({ info, stats }: StatsPanelProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      padding: "14px 16px", background: "var(--bg-surface)",
      borderRight: "1px solid var(--bg-divider)", overflowY: "auto",
      minWidth: 210, flexShrink: 0,
    }}>
      {info ? (
        <div style={{ paddingBottom: 11, borderBottom: "1px solid var(--bg-divider)" }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "var(--accent-base)",
            letterSpacing: "-0.01em", lineHeight: 1.3, marginBottom: 3,
          }}>
            {info.name || "Unnamed Build"}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
            {[info.class, info.ascendancy && info.ascendancy !== info.class ? info.ascendancy : null]
              .filter(Boolean).join(" / ")}
            {info.level
              ? <span style={{ color: "var(--fg-muted)", marginLeft: 6 }}>
                  Lv <span style={{ fontFamily: "var(--font-geist-mono, var(--mono))" }}>{info.level}</span>
                </span>
              : null}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--fg-faint)", paddingBottom: 12 }}>No build loaded</div>
      )}

      {stats && (
        <>
          <SectionLabel>Defences</SectionLabel>
          <StatRow label="Life"          value={stats.Life}          color="var(--state-crit-fg)" />
          <StatRow label="Energy Shield" value={stats.EnergyShield}  color="var(--res-cold)" />
          <StatRow label="Mana"          value={stats.Mana}          color="oklch(0.72 0.12 260)" />
          <StatRow label="Evasion"       value={stats.Evasion}       color="var(--state-healthy-fg)" />
          <StatRow label="Armour"        value={stats.Armour}        color="oklch(0.74 0.12 50)" />
          <StatRow label="Life Regen"    value={stats.LifeRegen}     color="oklch(0.68 0.12 15)" unit="/s" />
          <StatRow label="Mana Regen"    value={stats.ManaRegen}     color="oklch(0.68 0.10 260)" unit="/s" />

          <SectionLabel>Resistances</SectionLabel>
          <ResistRow label="Fire"      value={stats.FireResist}      color="var(--res-fire)" />
          <ResistRow label="Cold"      value={stats.ColdResist}      color="var(--res-cold)" />
          <ResistRow label="Lightning" value={stats.LightningResist} color="var(--res-lightning)" />
          <ResistRow label="Chaos"     value={stats.ChaosResist}     color="var(--res-chaos)" />

          {Object.keys(stats).some((k) => k.toLowerCase().includes("dps")) && (
            <>
              <SectionLabel>Damage</SectionLabel>
              {Object.entries(stats)
                .filter(([k]) => k.toLowerCase().includes("dps"))
                .map(([k, v]) => <StatRow key={k} label={k} value={v} color="var(--state-healthy-fg)" />)}
            </>
          )}
        </>
      )}
    </div>
  );
}
