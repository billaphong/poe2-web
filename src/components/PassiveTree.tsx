"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { TreeData, TreePositionNode } from "@/types/build";

// ── Types ──────────────────────────────────────────────────────
interface PassiveTreeProps {
  tree: TreeData | null;
  positions: TreePositionNode[] | null;
}

// ── Constants ──────────────────────────────────────────────────
const CLASS_NAMES: Record<number, string> = {
  0: "Witch", 1: "Ranger", 2: "Duelist",
  3: "Marauder", 4: "Shadow", 5: "Templar", 6: "Scion",
};

const NODE_COLORS = {
  keystone: { dot: "#f59e0b", glow: "#f59e0b55", dim: "#78350f" },
  notable:  { dot: "#a78bfa", glow: "#a78bfa44", dim: "#2e1065" },
  mastery:  { dot: "#60a5fa", glow: "#60a5fa33", dim: "#1e3a5f" },
  normal:   { dot: "#d97706", glow: "",           dim: "#1f2937" },
};

const NODE_RADII = { keystone: 6, notable: 4, mastery: 3.5, normal: 2.2 };
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 28;
const ZOOM_FACTOR = 1.12;

// ── Tooltip ────────────────────────────────────────────────────
function Tooltip({ node, sx, sy, canvasW, canvasH }: {
  node: TreePositionNode; sx: number; sy: number; canvasW: number; canvasH: number;
}) {
  const W = 220;
  const left = sx + 16 + W > canvasW ? sx - W - 10 : sx + 16;
  const top  = Math.min(sy + 8, canvasH - 180);

  const typeColor: Record<string, string> = {
    keystone: "#f59e0b", notable: "#a78bfa", mastery: "#60a5fa", normal: "var(--fg-tertiary)",
  };

  return (
    <div style={{
      position: "absolute", left, top, width: W, zIndex: 20,
      background: "var(--bg-raised)", border: "1px solid var(--bg-border)",
      borderRadius: "var(--r-md)", padding: "8px 10px", pointerEvents: "none",
      boxShadow: "0 6px 24px rgba(0,0,0,0.7)",
    }}>
      {node.name && (
        <div style={{
          fontSize: 12, fontWeight: 600, color: typeColor[node.type],
          lineHeight: 1.3, marginBottom: node.stats?.length ? 6 : 0,
        }}>
          {node.name}
        </div>
      )}
      {node.stats?.map((s, i) => (
        <div key={i} style={{ fontSize: 11, color: "var(--fg-secondary)", lineHeight: 1.5 }}>{s}</div>
      ))}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 6, paddingTop: 5, borderTop: "1px solid var(--bg-divider)",
      }}>
        <span style={{
          fontSize: 9.5, color: typeColor[node.type], fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {node.type}
        </span>
        {node.allocated && (
          <span style={{
            fontSize: 9.5, color: "var(--accent-base)",
            background: "var(--accent-softer)", padding: "1px 6px",
            borderRadius: "var(--r-sm)", border: "1px solid var(--accent-soft)",
          }}>
            Allocated
          </span>
        )}
      </div>
    </div>
  );
}

// ── Canvas renderer ────────────────────────────────────────────
function TreeCanvas({ positions, width, height, classId, treeVersion, onClose }: {
  positions: TreePositionNode[];
  width: number; height: number;
  classId?: number; treeVersion?: string;
  onClose?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cam = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0 });
  const [hovered, setHovered] = useState<{ node: TreePositionNode; sx: number; sy: number } | null>(null);

  // Full-tree bounds and allocated-only bounds
  const bounds = useMemo(() => {
    if (!positions.length) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let aMinX = Infinity, aMaxX = -Infinity, aMinY = Infinity, aMaxY = -Infinity;
    for (const n of positions) {
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
      if (n.allocated) {
        if (n.x < aMinX) aMinX = n.x; if (n.x > aMaxX) aMaxX = n.x;
        if (n.y < aMinY) aMinY = n.y; if (n.y > aMaxY) aMaxY = n.y;
      }
    }
    const hasAlloc = aMinX !== Infinity;
    return {
      full: { minX, maxX, minY, maxY },
      alloc: hasAlloc ? { minX: aMinX, maxX: aMaxX, minY: aMinY, maxY: aMaxY } : null,
    };
  }, [positions]);

  // Position lookup map for edge drawing
  const posMap = useMemo(() => {
    const m = new Map<number, TreePositionNode>();
    for (const n of positions) m.set(n.id, n);
    return m;
  }, [positions]);

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
    const vMinX = -cx / s, vMaxX = (width - cx) / s;
    const vMinY = -cy / s, vMaxY = (height - cy) / s;

    // ── Edges (batched by type for performance) ──────────────────
    const edgeW = Math.max(0.3, Math.min(s * 0.002, 1.5));

    // Unallocated edges
    ctx.beginPath();
    for (const node of positions) {
      if (!node.connections?.length) continue;
      if (node.x < vMinX - 500 || node.x > vMaxX + 500) continue;
      for (const connId of node.connections) {
        if (connId <= node.id) continue; // deduplicate: only draw each edge once
        const to = posMap.get(connId);
        if (!to) continue;
        if (node.allocated && to.allocated) continue; // skip allocated (drawn separately)
        ctx.moveTo(node.x * s + cx, node.y * s + cy);
        ctx.lineTo(to.x * s + cx, to.y * s + cy);
      }
    }
    ctx.strokeStyle = "oklch(0.28 0.005 60)";
    ctx.lineWidth = edgeW;
    ctx.stroke();

    // Allocated path edges (brighter, thicker)
    ctx.beginPath();
    for (const node of positions) {
      if (!node.allocated || !node.connections?.length) continue;
      for (const connId of node.connections) {
        if (connId <= node.id) continue;
        const to = posMap.get(connId);
        if (!to?.allocated) continue;
        ctx.moveTo(node.x * s + cx, node.y * s + cy);
        ctx.lineTo(to.x * s + cx, to.y * s + cy);
      }
    }
    ctx.strokeStyle = "oklch(0.52 0.10 75)";
    ctx.lineWidth = Math.max(0.8, edgeW * 2.5);
    ctx.stroke();

    // ── Nodes ────────────────────────────────────────────────────
    for (let pass = 0; pass < 2; pass++) {
      const alloc = pass === 1;
      for (const node of positions) {
        if (node.allocated !== alloc) continue;
        if (node.x < vMinX || node.x > vMaxX || node.y < vMinY || node.y > vMaxY) continue;

        const sx = node.x * s + cx;
        const sy = node.y * s + cy;
        const baseR = NODE_RADII[node.type];
        const r = Math.max(alloc ? 1.2 : 0.5, baseR * Math.min(s * 0.013, 2.2));

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = alloc ? NODE_COLORS[node.type].dot : NODE_COLORS[node.type].dim;
        ctx.fill();

        if (alloc && NODE_COLORS[node.type].glow && r > 1.5) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
          ctx.strokeStyle = NODE_COLORS[node.type].glow;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
  }, [positions, posMap, width, height]);

  // Fit to a bounding box
  const fitBox = useCallback((minX: number, maxX: number, minY: number, maxY: number, pad = 120) => {
    const rangeX = (maxX - minX + pad * 2) || 1;
    const rangeY = (maxY - minY + pad * 2) || 1;
    const s = Math.min((width - 64) / rangeX, (height - 64) / rangeY);
    cam.current = {
      scale: s,
      x: (width - rangeX * s) / 2 - (minX - pad) * s,
      y: (height - rangeY * s) / 2 - (minY - pad) * s,
    };
    draw();
  }, [width, height, draw]);

  // ⤢ button: fit full tree
  const fitToView = useCallback(() => {
    if (!bounds) return;
    const { minX, maxX, minY, maxY } = bounds.full;
    fitBox(minX, maxX, minY, maxY, 80);
  }, [bounds, fitBox]);

  // On open: zoom to the allocated path with generous padding
  const fitToAllocated = useCallback(() => {
    if (!bounds) return;
    const b = bounds.alloc ?? bounds.full;
    fitBox(b.minX, b.maxX, b.minY, b.maxY, 400);
  }, [bounds, fitBox]);

  // Fit to build path on first render
  useEffect(() => { fitToAllocated(); }, [fitToAllocated]);

  // Re-draw on resize without resetting zoom
  useEffect(() => { draw(); }, [width, height, draw]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom — non-passive to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const next = Math.max(ZOOM_MIN, Math.min(cam.current.scale * factor, ZOOM_MAX));
      const ratio = next / cam.current.scale;
      cam.current.x = mx - (mx - cam.current.x) * ratio;
      cam.current.y = my - (my - cam.current.y) * ratio;
      cam.current.scale = next;
      draw();
      setHovered(null);
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [draw]);

  // ESC to close fullscreen
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, cx: cam.current.x, cy: cam.current.y };
    setHovered(null);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag.current.active) {
      cam.current.x = drag.current.cx + e.clientX - drag.current.sx;
      cam.current.y = drag.current.cy + e.clientY - drag.current.sy;
      draw();
      return;
    }
    // Hover hit-test
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const s = cam.current.scale;
    const wx = (sx - cam.current.x) / s;
    const wy = (sy - cam.current.y) / s;
    const thresh = 10 / s;
    let best: TreePositionNode | null = null, bestD = thresh;
    for (const n of positions) {
      const dx = n.x - wx, dy = n.y - wy;
      if (Math.abs(dx) > thresh || Math.abs(dy) > thresh) continue;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = n; }
    }
    setHovered(best ? { node: best, sx, sy } : null);
  }, [positions, draw]);

  const onMouseUp   = useCallback(() => { drag.current.active = false; }, []);
  const onMouseLeave = useCallback(() => { drag.current.active = false; setHovered(null); }, []);

  const zoom = useCallback((f: number) => {
    const cx = width / 2, cy = height / 2;
    const next = Math.max(ZOOM_MIN, Math.min(cam.current.scale * f, ZOOM_MAX));
    const ratio = next / cam.current.scale;
    cam.current.x = cx - (cx - cam.current.x) * ratio;
    cam.current.y = cy - (cy - cam.current.y) * ratio;
    cam.current.scale = next;
    draw(); setHovered(null);
  }, [width, height, draw]);

  const allocCount = positions.filter(n => n.allocated).length;
  const className = CLASS_NAMES[classId ?? -1] ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Canvas wrapper */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden", userSelect: "none" }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          style={{ display: "block", cursor: "crosshair" }}
        />

        {hovered && (
          <Tooltip node={hovered.node} sx={hovered.sx} sy={hovered.sy} canvasW={width} canvasH={height} />
        )}

        {/* Zoom controls */}
        <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", flexDirection: "column", gap: 3 }}>
          {([
            { label: "+", action: () => zoom(ZOOM_FACTOR * 2) },
            { label: "−", action: () => zoom(1 / (ZOOM_FACTOR * 2)) },
            { label: "⤢", action: fitToView },
          ] as const).map(({ label, action }) => (
            <button key={label} onClick={action} style={{
              width: 28, height: 28, background: "var(--bg-raised)",
              border: "1px solid var(--bg-border)", borderRadius: "var(--r-sm)",
              color: "var(--fg-secondary)", fontSize: label === "⤢" ? 13 : 16,
              fontFamily: "var(--font-geist-mono, var(--mono))",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = "var(--bg-hover)"; b.style.color = "var(--fg-primary)"; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = "var(--bg-raised)"; b.style.color = "var(--fg-secondary)"; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 12px", borderTop: "1px solid var(--bg-divider)",
        background: "var(--bg-surface)", flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "var(--accent-base)", fontWeight: 600 }}>{className}</span>
        <div style={{ display: "flex", gap: 14 }}>
          {(["keystone", "notable", "normal"] as const).map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={8} height={8}><circle cx={4} cy={4} r={3} fill={NODE_COLORS[t].dot} /></svg>
              <span style={{ fontSize: 10, color: "var(--fg-muted)", textTransform: "capitalize" }}>{t}</span>
            </span>
          ))}
        </div>
        <span style={{ fontSize: 10, color: "var(--fg-muted)", fontFamily: "var(--font-geist-mono, var(--mono))" }}>
          {allocCount} allocated{treeVersion ? ` · v${treeVersion}` : ""}
        </span>
      </div>
    </div>
  );
}

// ── Fullscreen overlay wrapper ─────────────────────────────────
function FullscreenTree({ tree, positions, onClose }: {
  tree: TreeData | null;
  positions: TreePositionNode[];
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1200, h: 800 });
  const [enrichedPositions, setEnrichedPositions] = useState<TreePositionNode[]>(positions);

  // Measure container
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDims({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fetch static connection data and merge into positions
  // tree-connections.json is pre-generated from tree.json — static game data, never changes
  useEffect(() => {
    fetch("/tree-connections.json")
      .then(r => r.json())
      .then((conns: Record<string, number[]>) => {
        setEnrichedPositions(
          positions.map(node => ({
            ...node,
            connections: node.connections?.length
              ? node.connections
              : (conns[String(node.id)] ?? []),
          }))
        );
      })
      .catch(() => setEnrichedPositions(positions));
  }, [positions]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "var(--bg-app)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", height: 38,
        padding: "0 16px", borderBottom: "1px solid var(--bg-divider)",
        background: "var(--bg-surface)", flexShrink: 0, gap: 12,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "var(--r-sm)",
          background: "linear-gradient(135deg, var(--accent-base), var(--accent-dim))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-geist-mono, var(--mono))",
          fontWeight: 700, fontSize: 10, color: "var(--bg-app)",
        }}>P2</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-primary)" }}>Passive Tree</span>
        <span style={{
          fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--fg-muted)", padding: "1px 5px",
          background: "var(--bg-raised)", borderRadius: "var(--r-sm)",
          border: "1px solid var(--bg-border)",
        }}>
          Scroll to zoom · Drag to pan · Hover for stats
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 26,
            padding: "0 10px", background: "var(--bg-raised)",
            border: "1px solid var(--bg-border)", borderRadius: "var(--r-sm)",
            color: "var(--fg-secondary)", fontSize: 11, cursor: "pointer",
            fontFamily: "var(--font-geist, var(--sans))",
          }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.background = "var(--bg-hover)"; b.style.color = "var(--fg-primary)"; }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.background = "var(--bg-raised)"; b.style.color = "var(--fg-secondary)"; }}
        >
          Close <span style={{ color: "var(--fg-faint)", fontSize: 10 }}>Esc</span>
        </button>
      </div>

      {/* Tree fills remaining space */}
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        {dims.w > 0 && (
          <TreeCanvas
            positions={enrichedPositions}
            width={dims.w}
            height={dims.h}
            classId={tree?.classId}
            treeVersion={tree?.treeVersion}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ── Ring summary (compact inline view) ────────────────────────
function RingSummary({ tree, onExpand, hasPositions }: {
  tree: TreeData; onExpand: () => void; hasPositions: boolean;
}) {
  const nodes = tree.nodes as number[];
  const className = CLASS_NAMES[tree.classId ?? -1] ?? "Unknown";
  const pct = Math.min(nodes.length / 120, 1);
  const r = 56;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "14px 20px",
      background: "var(--bg-surface)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--bg-border)",
    }}>
      {/* Ring */}
      <svg width={130} height={130} viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
        {[52, 40, 28, 16].map(r2 => (
          <circle key={r2} cx={65} cy={65} r={r2} fill="none" stroke="var(--bg-divider)" strokeWidth={1.5} />
        ))}
        <circle cx={65} cy={65} r={r} fill="none" stroke="var(--accent-base)" strokeWidth={6}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round" opacity={0.85}
        />
        <text x={65} y={60} textAnchor="middle" fill="var(--accent-base)"
          fontSize={22} fontWeight="bold" fontFamily="var(--font-geist-mono, monospace)">
          {nodes.length}
        </text>
        <text x={65} y={76} textAnchor="middle" fill="var(--fg-muted)" fontSize={9} fontFamily="sans-serif">
          NODES ALLOCATED
        </text>
      </svg>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-base)", marginBottom: 4 }}>
          {className}
        </div>
        {tree.treeVersion && (
          <div style={{ fontSize: 10, color: "var(--fg-faint)", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 12 }}>
            v{tree.treeVersion}
          </div>
        )}
        <button
          onClick={onExpand}
          disabled={!hasPositions}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 30, padding: "0 14px",
            background: hasPositions ? "var(--accent-softer)" : "var(--bg-raised)",
            border: `1px solid ${hasPositions ? "var(--accent-soft)" : "var(--bg-border)"}`,
            borderRadius: "var(--r-md)",
            color: hasPositions ? "var(--accent-base)" : "var(--fg-faint)",
            fontSize: 11, fontWeight: 600, cursor: hasPositions ? "pointer" : "not-allowed",
            fontFamily: "var(--font-geist, var(--sans))",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={e => { if (hasPositions) { const b = e.currentTarget; b.style.background = "var(--accent-soft)"; b.style.borderColor = "var(--accent-dim)"; }}}
          onMouseLeave={e => { if (hasPositions) { const b = e.currentTarget; b.style.background = "var(--accent-softer)"; b.style.borderColor = "var(--accent-soft)"; }}}
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hasPositions ? "Open Full Tree" : "Loading tree…"}
        </button>
      </div>
    </div>
  );
}

// ── Public component ───────────────────────────────────────────
export default function PassiveTree({ tree, positions }: PassiveTreeProps) {
  const [open, setOpen] = useState(false);

  const hasPositions = !!positions?.length;
  const hasTree = !!(tree?.nodes?.length && typeof (tree.nodes as unknown[])[0] === "number");

  if (!hasTree) {
    return (
      <div style={{
        padding: "20px", background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)", border: "1px solid var(--bg-border)",
        color: "var(--fg-faint)", fontSize: 11, textAlign: "center",
      }}>
        Passive tree will appear after loading a build
      </div>
    );
  }

  return (
    <>
      <RingSummary tree={tree!} onExpand={() => setOpen(true)} hasPositions={hasPositions} />

      {open && hasPositions && (
        <FullscreenTree
          tree={tree}
          positions={positions!}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
