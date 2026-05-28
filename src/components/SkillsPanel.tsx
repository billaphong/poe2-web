"use client";

import type { SkillGroup } from "@/types/build";

interface SkillsPanelProps {
  skills: SkillGroup[] | null;
}

const GEM_QUALITY_COLOR = (quality: number) =>
  quality >= 20 ? "var(--accent-base)" : quality > 0 ? "var(--fg-tertiary)" : "var(--fg-faint)";

function GemChip({ name, level, quality, enabled }: {
  name: string; level: number; quality: number; enabled: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 8px",
      background: enabled ? "var(--bg-raised)" : "var(--bg-surface)",
      border: `1px solid ${enabled ? "var(--bg-border)" : "var(--bg-divider)"}`,
      borderRadius: "var(--r-sm)",
      opacity: enabled ? 1 : 0.5,
    }}>
      {/* Gem color indicator */}
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: enabled ? "var(--accent-dim)" : "var(--fg-faint)",
        flexShrink: 0,
      }} />

      {/* Gem name */}
      <span style={{ fontSize: 11, color: enabled ? "var(--fg-secondary)" : "var(--fg-muted)", flex: 1 }}>
        {name}
      </span>

      {/* Level + Quality */}
      <span style={{
        fontFamily: "var(--font-geist-mono, var(--mono))",
        fontSize: 10,
        color: "var(--fg-muted)",
        letterSpacing: "-0.01em",
      }}>
        {level > 0 && <span>L{level}</span>}
        {quality > 0 && (
          <span style={{ marginLeft: 3, color: GEM_QUALITY_COLOR(quality) }}>Q{quality}</span>
        )}
      </span>
    </div>
  );
}

export default function SkillsPanel({ skills }: SkillsPanelProps) {
  if (!skills?.length) {
    return (
      <div style={{
        padding: "20px 24px",
        color: "var(--fg-faint)",
        fontSize: 11,
        borderTop: "1px solid var(--bg-divider)",
      }}>
        Skills will appear after loading a build
      </div>
    );
  }

  const activeGroups = skills.filter((g) => g.gems?.length > 0);

  return (
    <div style={{
      padding: "16px 24px 24px",
      borderTop: "1px solid var(--bg-divider)",
    }}>
      {/* Section header */}
      <div style={{
        fontSize: 9.5,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        fontWeight: 600,
        color: "var(--fg-muted)",
        marginBottom: 12,
      }}>
        Skills &amp; Gems
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap" as const,
        gap: 16,
      }}>
        {activeGroups.map((group, gi) => (
          <div key={gi} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-divider)",
            borderRadius: "var(--r-lg)",
            padding: "10px 12px",
            minWidth: 180,
          }}>
            {/* Group label */}
            {group.label && (
              <div style={{
                fontSize: 9.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "var(--fg-muted)",
                marginBottom: 6,
              }}>
                {group.label}
              </div>
            )}

            {/* Gems */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {group.gems.map((gem, i) => (
                <GemChip
                  key={i}
                  name={gem.name}
                  level={gem.level}
                  quality={gem.quality}
                  enabled={gem.enabled}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
