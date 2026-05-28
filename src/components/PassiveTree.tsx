"use client";

import { useEffect, useRef, useMemo } from "react";
import type { TreeData, TreeNode } from "@/types/build";

interface PassiveTreeProps {
  tree: TreeData | null;
  width?: number;
  height?: number;
}

const PADDING = 40;

function getNodeRadius(node: TreeNode): number {
  if (node.isKeystone) return 10;
  if (node.isNotable) return 7;
  if (node.isMastery) return 6;
  return 4;
}

function getNodeColor(node: TreeNode): string {
  if (!node.allocated) return "#374151";
  if (node.isKeystone) return "#f59e0b";
  if (node.isNotable) return "#fbbf24";
  return "#d97706";
}

export default function PassiveTree({
  tree,
  width = 600,
  height = 600,
}: PassiveTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bounds = useMemo(() => {
    if (!tree?.nodes?.length) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of tree.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    return { minX, maxX, minY, maxY };
  }, [tree]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tree?.nodes?.length || !bounds) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { minX, maxX, minY, maxY } = bounds;
    const treeWidth = maxX - minX || 1;
    const treeHeight = maxY - minY || 1;

    const drawWidth = width - PADDING * 2;
    const drawHeight = height - PADDING * 2;
    const scale = Math.min(drawWidth / treeWidth, drawHeight / treeHeight);

    const toCanvas = (x: number, y: number) => ({
      cx: PADDING + (x - minX) * scale,
      cy: PADDING + (y - minY) * scale,
    });

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    for (const node of tree.nodes) {
      const { cx, cy } = toCanvas(node.x, node.y);
      const r = getNodeRadius(node) * Math.max(0.5, Math.min(scale / 8, 2));

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = getNodeColor(node);
      ctx.fill();

      if (node.allocated) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [tree, bounds, width, height]);

  if (!tree?.nodes?.length) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700 text-gray-500 text-sm"
      >
        Passive tree will appear here after loading a build
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-gray-700"
      style={{ display: "block" }}
    />
  );
}
