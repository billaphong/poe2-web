"use client";

import { useEffect, useRef, useMemo } from "react";
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
  keystone:  { normal: "#78350f", allocated: "#f59e0b" },
  notable:   { normal: "#312e81", allocated: "#a78bfa" },
  mastery:   { normal: "#1e3a5f", allocated: "#60a5fa" },
  normal:    { normal: "#1f2937", allocated: "#d97706" },
};

const NODE_RADII = {
  keystone: 5,
  notable: 3.5,
  mastery: 3,
  normal: 2,
};

const PADDING = 32;

function TreeCanvas({
  positions, width, height, classId, treeVersion,
}: {
  positions: TreePositionNode[];
  width: number;
  height: number;
  classId?: number;
  treeVersion?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bounds) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { minX, maxX, minY, maxY } = bounds;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const drawW = width - PADDING * 2;
    const drawH = height - PADDING * 2;
    const scale = Math.min(drawW / rangeX, drawH / rangeY);
    const offX = PADDING + (drawW - rangeX * scale) / 2;
    const offY = PADDING + (drawH - rangeY * scale) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Draw unallocated first, then allocated on top
    const unalloc = positions.filter(n => !n.allocated);
    const alloc = positions.filter(n => n.allocated);

    for (const node of unalloc) {
      const cx = offX + (node.x - minX) * scale;
      const cy = offY + (node.y - minY) * scale;
      const r = Math.max(0.8, NODE_RADII[node.type] * Math.min(scale / 80, 1.5));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = NODE_COLORS[node.type].normal;
      ctx.fill();
    }

    for (const node of alloc) {
      const cx = offX + (node.x - minX) * scale;
      const cy = offY + (node.y - minY) * scale;
      const r = Math.max(1.5, NODE_RADII[node.type] * Math.min(scale / 80, 1.5));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = NODE_COLORS[node.type].allocated;
      ctx.fill();
      // Glow ring for keystones/notables
      if (node.type === "keystone" || node.type === "notable") {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = NODE_COLORS[node.type].allocated + "44";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [positions, bounds, width, height]);

  const allocCount = positions.filter(n => n.allocated).length;
  const className = CLASS_NAMES[classId ?? -1] ?? "";

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg border border-gray-800"
        style={{ display: "block" }}
      />
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span className="text-yellow-400 font-semibold">{className}</span>
        <span>{allocCount} nodes allocated</span>
        {treeVersion && <span>v{treeVersion}</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs px-1">
        {(["keystone", "notable", "normal"] as const).map((type) => (
          <span key={type} className="flex items-center gap-1">
            <svg width={8} height={8}><circle cx={4} cy={4} r={3} fill={NODE_COLORS[type].allocated} /></svg>
            <span className="text-gray-400 capitalize">{type}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PassiveTree({ tree, positions, width = 600, height = 520 }: PassiveTreeProps) {
  if (!positions?.length) {
    // Fallback: show ring summary if we have allocated node IDs but no positions yet
    if (tree?.nodes?.length && typeof (tree.nodes as unknown[])[0] === "number") {
      const allocIds = tree.nodes as number[];
      const className = CLASS_NAMES[tree.classId ?? -1] ?? "Unknown";
      return (
        <div style={{ width, height }} className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border border-gray-700 gap-6 p-8">
          <svg width={240} height={240} viewBox="0 0 240 240">
            {[90, 70, 50, 30].map(r => <circle key={r} cx={120} cy={120} r={r} fill="none" stroke="#1f2937" strokeWidth={2} />)}
            <circle cx={120} cy={120} r={90} fill="none" stroke="#d97706" strokeWidth={8}
              strokeDasharray={`${Math.min(allocIds.length / 120, 1) * 2 * Math.PI * 90} ${2 * Math.PI * 90}`}
              strokeDashoffset={2 * Math.PI * 90 * 0.25} strokeLinecap="round" opacity={0.7} />
            <text x={120} y={112} textAnchor="middle" fill="#fbbf24" fontSize={32} fontWeight="bold" fontFamily="monospace">{allocIds.length}</text>
            <text x={120} y={134} textAnchor="middle" fill="#9ca3af" fontSize={12} fontFamily="sans-serif">nodes allocated</text>
          </svg>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold text-sm">{className}</div>
            {tree.treeVersion && <div className="text-gray-600 text-xs mt-1">v{tree.treeVersion}</div>}
          </div>
        </div>
      );
    }
    return (
      <div style={{ width, height }} className="flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700 text-gray-500 text-sm">
        Passive tree will appear here after loading a build
      </div>
    );
  }

  return <TreeCanvas positions={positions} width={width} height={height} classId={tree?.classId} treeVersion={tree?.treeVersion} />;
}
