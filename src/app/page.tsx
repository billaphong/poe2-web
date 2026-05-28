"use client";

import { useState, useCallback } from "react";
import BuildInputBar from "@/components/BuildInputBar";
import PassiveTree from "@/components/PassiveTree";
import GearSlots from "@/components/GearSlots";
import StatsPanel from "@/components/StatsPanel";
import SkillsPanel from "@/components/SkillsPanel";
import { loadBuild, fetchAllBuildData } from "@/lib/apiClient";
import type { BuildData } from "@/types/build";

const CLASS_NAMES: Record<number, string> = {
  0: "Witch", 1: "Ranger", 2: "Duelist",
  3: "Marauder", 4: "Shadow", 5: "Templar", 6: "Scion",
};

export default function HomePage() {
  const [buildData, setBuildData] = useState<BuildData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);
    try {
      await loadBuild(input);
      const data = await fetchAllBuildData();
      if (!data.info.class && data.tree.classId !== undefined) {
        data.info.class = CLASS_NAMES[data.tree.classId] ?? "Unknown";
      }
      setBuildData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load build. Check the URL or code and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    /* Full viewport column — header pinned, main section fills the rest */
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--bg-app)",
      overflow: "hidden",
    }}>

      {/* ── Header (38px HB top-bar) ────────────────────────────── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        height: 38,
        padding: "0 20px",
        background: "var(--bg-app)",
        borderBottom: "1px solid var(--bg-divider)",
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Brand mark */}
        <div style={{
          width: 24, height: 24, borderRadius: "var(--r-md)",
          background: "linear-gradient(135deg, var(--accent-base), var(--accent-dim))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-geist-mono, var(--mono))",
          fontWeight: 700, fontSize: 11, color: "var(--bg-app)",
        }}>P2</div>

        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-primary)" }}>
          Path of Building
        </span>

        <span style={{
          fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--fg-muted)", padding: "2px 6px",
          background: "var(--bg-surface)", borderRadius: "var(--r-sm)",
          border: "1px solid var(--bg-border)",
        }}>
          PoE2
        </span>

        <div style={{ flex: 1 }} />

        {buildData && (
          <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>
            <span style={{ color: "var(--fg-tertiary)" }}>{buildData.info.class}</span>
            {buildData.info.level && (
              <>
                <span style={{ margin: "0 5px", color: "var(--fg-faint)" }}>·</span>
                <span style={{ fontFamily: "var(--font-geist-mono, var(--mono))" }}>
                  Lv {buildData.info.level}
                </span>
              </>
            )}
          </div>
        )}

        <span style={{
          fontSize: 9.5, color: "var(--fg-faint)",
          fontFamily: "var(--font-geist-mono, var(--mono))",
        }}>
          Not affiliated with GGG
        </span>
      </header>

      {/* ── Input bar ───────────────────────────────────────────── */}
      <div style={{
        padding: "8px 20px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--bg-divider)",
        flexShrink: 0,
      }}>
        <BuildInputBar onLoad={handleLoad} loading={loading} error={error} />
      </div>

      {/* ── Above-fold section: Stats (left) + Gear (right) ─────── */}
      {/*    flex: 1 + min-height: 0 lets this section fill remaining  */}
      {/*    viewport without overflowing the fixed header             */}
      <div style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}>

        {/* Stats sidebar */}
        <StatsPanel
          info={buildData?.info ?? null}
          stats={buildData?.stats ?? null}
        />

        {/* Gear + scroll area */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowY: "auto",
        }}>

          {/* Gear section — padded, labeled */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--bg-divider)",
          }}>
            <div style={{
              fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase",
              fontWeight: 600, color: "var(--fg-muted)", marginBottom: 10,
            }}>
              Equipment
            </div>
            <GearSlots items={buildData?.items ?? null} />
          </div>

          {/* Passive tree */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--bg-divider)",
          }}>
            <div style={{
              fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase",
              fontWeight: 600, color: "var(--fg-muted)", marginBottom: 10,
            }}>
              Passive Tree
            </div>
            <PassiveTree
              tree={buildData?.tree ?? null}
              positions={buildData?.treePositions ?? null}
              width={880}
              height={520}
            />
          </div>

          {/* Skills & gems */}
          <SkillsPanel skills={buildData?.skills ?? null} />

        </div>
      </div>

    </div>
  );
}
