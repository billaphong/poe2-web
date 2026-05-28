"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { TreeData, TreePositionNode } from "@/types/build";

interface PassiveTreeProps {
  tree: TreeData | null;
  positions: TreePositionNode[] | null;
  width?: number;
  height?: number;
}

const CLASS_NAMES: Record<number, string> = {
  0: "Witch", 1: "Ranger", 2: "Duelist",
  3: "Marauder", 4: "Shadow", 5: "Templar", 6: "Scion",
};

const NODE_COLORS = {
  keystone: { bg: "oklch(0.14 0.05 60)",   dot: "#f59e0b", glow: "#f59e0b55" },
  notable:  { bg: "oklch(0.14 0.04 260)",  dot: "#a78bfa", glow: "#a78bfa44" },
  mastery:  { bg: "oklch(0.14 0.04 220)",  dot: "#60a5fa", glow: "#60a5fa33" },
  normal:   { bg: "oklch(0.22 0.005 60)",  dot: "#d97706", glow: "" },
  unalloc:  {
    keystone: "#78350f",
    notable:  "#2e1065",
    mastery:  "#1e3a5f",
    normal:   "#1f2937",
  },
};

const NODE_RADII = { keystone: 6, notable: 4, mastery: 3.5, normal: 2.2 };

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 24;
const ZOOM_STEP = 1.14;

// ── Tooltip ────────────────────────────────────────────────────
function Tooltip({ node, x, y, canvasW, canvasH }: {
  node: TreePositionNode; x: number; y: number; canvasW: number; canvasH: number;
}) {
  const W = 210;
  const left = x + 14 + W > canvasW ? x - W - 10 : x + 14;
  const top  = y + 10;

  const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
  const typeColor = {
    keystone: "#f59e0b", notable: "#a78bfa", mastery: "#60a5fa", normal: "var(--fg-tertiary)",
  }[node.type];

  return (
    <div style={{
      position: "absolute",
      left, top,
      width: W,
      background: "var(--bg-raised)",
      border: "1px solid var(--bg-border)",
      borderRadius: "var(--r-md)",
      padding: "8px 10px",
      pointerEvents: "none",
      zIndex: 10,
      boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
    }}>
      {/* Node name */}
      {node.name && (
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: typeColor,
          marginBottom: node.stats?.length ? 5 : 0,
          lineHeight: 1.3,
        }}>
          {node.name}
        </div>
      )}

      {/* Stats */}
      {node.stats?.map((stat, i) => (
        <div key={i} style={{
          fontSize: 11,
          color: "var(--fg-secondary)",
          lineHeight: 1.5,
        }}>
          {stat}
        </div>
      ))}

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 6, paddingTop: 5,
        borderTop: "1px solid var(--bg-divider)",
      }}>
        <span style={{ fontSize: 9.5, letterSpacing: "0.06em", color: typeColor, fontWeight: 600 }}>
          {typeLabel}
        </span>
        {node.allocated && (
          <span style={{
            fontSize: 9.5, color: "var(--accent-base)",
            background: "var(--accent-softer)",
            padding: "1px 5px", borderRadius: "var(--r-sm)",
            border: "1px solid var(--accent-soft)",
          }}>
            Allocated
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main canvas tree ───────────────────────────────────────────
function TreeCanvas({ positions, width, height, classId, treeVersion }: {
  positions: TreePositionNode[];
  width: number;
  height: number;
  classId?: number;
  treeVersion?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera: use ref so pan/zoom don't trigger React re-renders
  const cam = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ active: boolean; sx: number; sy: number; cx: number; cy: number }>({
    active: false, sx: 0, sy: 0, cx: 0, cy: 0,
  });

  // Hover state (does trigger re-render — only fires when node changes)
  const [hovered, setHovered] = useState<{ node: TreePositionNode; sx: number; sy: number } | null>(null);

  // World-space bounds for initial fit
  const bounds = useMemo(() => {
    if (!positions.length) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of positions) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    return { minX, maxX, minY, maxY };
  }, [positions]);

  // Draw everything — pure function over cam ref + positions
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x: cx, y: cy, scale: s } = cam.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "oklch(0.13 0.004 60)";
    ctx.fillRect(0, 0, width, height);

    // Viewport culling bounds (world space)
    const vMinX = -cx / s;
    const vMaxX = (width - cx) / s;
    const vMinY = -cy / s;
    const vMaxY = (height - cy) / s;

    // Unallocated pass first, then allocated on top
    for (let pass = 0; pass < 2; pass++) {
      const wantAlloc = pass === 1;
      for (const node of positions) {
        if (node.allocated !== wantAlloc) continue;
        if (node.x < vMinX || node.x > vMaxX || node.y < vMinY || node.y > vMaxY) continue;

        const sx = node.x * s + cx;
        const sy = node.y * s + cy;
        const baseR = NODE_RADII[node.type];
        const r = Math.max(wantAlloc ? 1.2 : 0.6, baseR * Math.min(s * 0.012, 2));

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = wantAlloc
          ? NODE_COLORS[node.type].dot
          : NODE_COLORS.unalloc[node.type];
        ctx.fill();

        // Glow ring for allocated keystones/notables
        if (wantAlloc && (node.type === "keystone" || node.type === "notable") && r > 1) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
          ctx.strokeStyle = NODE_COLORS[node.type].glow;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
  }, [positions, width, height]);

  // Fit tree into canvas on first load
  const fitToView = useCallback(() => {
    if (!bounds) return;
    const { minX, maxX, minY, maxY } = bounds;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 48;
    const s = Math.min((width - pad * 2) / rangeX, (height - pad * 2) / rangeY);
    cam.current = {
      scale: s,
      x: (width - rangeX * s) / 2 - minX * s,
      y: (height - rangeY * s) / 2 - minY * s,
    };
    draw();
  }, [bounds, width, height, draw]);

  useEffect(() => { fitToView(); }, [fitToView]);

  // ── Wheel zoom (centered on cursor) ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const newScale = Math.max(ZOOM_MIN, Math.min(cam.current.scale * factor, ZOOM_MAX));
      const ratio = newScale / cam.current.scale;
      cam.current.x = mx - (mx - cam.current.x) * ratio;
      cam.current.y = my - (my - cam.current.y) * ratio;
      cam.current.scale = newScale;
      draw();
      setHovered(null);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [draw]);

  // ── Mouse drag + hover ─────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, cx: cam.current.x, cy: cam.current.y };
    setHovered(null);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag.current.active) {
      cam.current.x = drag.current.cx + (e.clientX - drag.current.sx);
      cam.current.y = drag.current.cy + (e.clientY - drag.current.sy);
      draw();
      return;
    }

    // Hover: convert screen → world, find nearest node
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const s = cam.current.scale;
    const wx = (sx - cam.current.x) / s;
    const wy = (sy - cam.current.y) / s;

    // Detection radius: 10px screen space → world units
    const thresh = 10 / s;
    let best: TreePositionNode | null = null;
    let bestD = thresh;

    for (const node of positions) {
      const dx = node.x - wx;
      const dy = node.y - wy;
      // Fast early-exit before sqrt
      if (Math.abs(dx) > thresh || Math.abs(dy) > thresh) continue;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = node; }
    }

    setHovered(best ? { node: best, sx, sy } : null);
  }, [positions, draw]);

  const onMouseUp = useCallback(() => { drag.current.active = false; }, []);
  const onMouseLeave = useCallback(() => { drag.current.active = false; setHovered(null); }, []);

  // ── Zoom buttons ──────────────────────────────────────────────
  const zoom = useCallback((factor: number) => {
    const cx = width / 2, cy = height / 2;
    const newScale = Math.max(ZOOM_MIN, Math.min(cam.current.scale * factor, ZOOM_MAX));
    const ratio = newScale / cam.current.scale;
    cam.current.x = cx - (cx - cam.current.x) * ratio;
    cam.current.y = cy - (cy - cam.current.y) * ratio;
    cam.current.scale = newScale;
    draw();
    setHovered(null);
  }, [width, height, draw]);

  const allocCount = positions.filter(n => n.allocated).length;
  const className = CLASS_NAMES[classId ?? -1] ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Canvas wrapper — relative so tooltip is positioned inside */}
      <div style={{ position: "relative", userSelect: "none" }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          style={{
            display: "block",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--bg-border)",
            cursor: drag.current.active ? "grabbing" : "crosshair",
          }}
        />

        {/* Hover tooltip */}
        {hovered && (
          <Tooltip
            node={hovered.node}
            x={hovered.sx}
            y={hovered.sy}
            canvasW={width}
            canvasH={height}
          />
        )}

        {/* Zoom controls — bottom-right corner */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {[
            { label: "+", fn: () => zoom(ZOOM_STEP * 1.5) },
            { label: "−", fn: () => zoom(1 / (ZOOM_STEP * 1.5)) },
            { label: "⤢", fn: fitToView },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              style={{
                width: 26, height: 26,
                background: "var(--bg-raised)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--r-sm)",
                color: "var(--fg-secondary)",
                fontSize: label === "⤢" ? 13 : 15,
                fontFamily: "var(--font-geist-mono, var(--mono))",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-raised)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-secondary)";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2px",
      }}>
        <span style={{ fontSize: 11, color: "var(--accent-base)", fontWeight: 600 }}>{className}</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {(["keystone", "notable", "normal"] as const).map((type) => (
            <span key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={8} height={8}>
                <circle cx={4} cy={4} r={3} fill={NODE_COLORS[type].dot} />
              </svg>
              <span style={{ fontSize: 10, color: "var(--fg-muted)", textTransform: "capitalize" }}>{type}</span>
            </span>
          ))}
        </div>
        <span style={{
          fontSize: 10,
          color: "var(--fg-muted)",
          fontFamily: "var(--font-geist-mono, var(--mono))",
        }}>
          {allocCount} allocated{treeVersion ? ` · v${treeVersion}` : ""}
        </span>
      </div>
    </div>
  );
}

// ── Public export ──────────────────────────────────────────────
export default function PassiveTree({ tree, positions, width = 880, height = 520 }: PassiveTreeProps) {
  if (!positions?.length) {
    if (tree?.nodes?.length && typeof (tree.nodes as unknown[])[0] === "number") {
      const ids = tree.nodes as number[];
      const className = CLASS_NAMES[tree.classId ?? -1] ?? "Unknown";
      return (
        <div style={{ width, height, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", background: "var(--bg-surface)", borderRadius: "var(--r-md)",
          border: "1px solid var(--bg-border)", gap: 12, padding: 32 }}>
          <svg width={180} height={180} viewBox="0 0 240 240">
            {[90, 70, 50, 30].map(r => <circle key={r} cx={120} cy={120} r={r} fill="none" stroke="var(--bg-divider)" strokeWidth={2} />)}
            <circle cx={120} cy={120} r={90} fill="none" stroke="var(--accent-base)" strokeWidth={7}
              strokeDasharray={`${Math.min(ids.length / 120, 1) * 2 * Math.PI * 90} ${2 * Math.PI * 90}`}
              strokeDashoffset={2 * Math.PI * 90 * 0.25} strokeLinecap="round" opacity={0.8} />
            <text x={120} y={112} textAnchor="middle" fill="var(--accent-base)" fontSize={30} fontWeight="bold" fontFamily="monospace">{ids.length}</text>
            <text x={120} y={134} textAnchor="middle" fill="var(--fg-muted)" fontSize={11} fontFamily="sans-serif">nodes allocated</text>
          </svg>
          <div style={{ fontSize: 11, color: "var(--accent-base)", fontWeight: 600 }}>{className}</div>
        </div>
      );
    }
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-surface)", borderRadius: "var(--r-md)", border: "1px solid var(--bg-border)",
        color: "var(--fg-faint)", fontSize: 11 }}>
        Passive tree will appear here after loading a build
      </div>
    );
  }

  return (
    <TreeCanvas
      positions={positions}
      width={width}
      height={height}
      classId={tree?.classId}
      treeVersion={tree?.treeVersion}
    />
  );
}
