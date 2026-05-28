"use client";

interface TreeNodeObj {
  id: number;
  x: number;
  y: number;
  name?: string;
  type?: "normal" | "notable" | "keystone" | "mastery" | "ascendancy" | "jewel";
  ascendancyName?: string;
}

interface PassiveTreeProps {
  tree: {
    nodes?: number[] | TreeNodeObj[];
    classId?: number;
    ascendClassId?: number;
    treeVersion?: string;
  } | null;
  width?: number;
  height?: number;
}

const CLASS_NAMES: Record<number, string> = {
  0: "Witch",
  1: "Ranger",
  2: "Duelist",
  3: "Marauder",
  4: "Shadow",
  5: "Templar",
  6: "Scion",
};

const NODE_COLORS: Record<string, string> = {
  keystone: "#f59e0b",
  notable: "#a78bfa",
  ascendancy: "#f97316",
  jewel: "#34d399",
  mastery: "#60a5fa",
  normal: "#6b7280",
};

const NODE_RADII: Record<string, number> = {
  keystone: 5,
  notable: 3.5,
  ascendancy: 4,
  jewel: 4,
  mastery: 3,
  normal: 2,
};

const PADDING = 40;

function TreeGraph({
  nodes,
  width,
  height,
  classId,
  treeVersion,
}: {
  nodes: TreeNodeObj[];
  width: number;
  height: number;
  classId?: number;
  treeVersion?: string;
}) {
  // Compute bounding box, ignoring ascendancy nodes (often far outliers)
  const mainNodes = nodes.filter((n) => !n.ascendancyName);
  const xs = mainNodes.map((n) => n.x);
  const ys = mainNodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const drawW = width - PADDING * 2;
  const drawH = height - PADDING * 2;

  // Uniform scale to preserve aspect ratio
  const scale = Math.min(drawW / rangeX, drawH / rangeY);

  // Center within the viewport
  const offsetX = PADDING + (drawW - rangeX * scale) / 2;
  const offsetY = PADDING + (drawH - rangeY * scale) / 2;

  function toSvg(x: number, y: number) {
    return {
      cx: offsetX + (x - minX) * scale,
      cy: offsetY + (y - minY) * scale,
    };
  }

  const className = CLASS_NAMES[classId ?? -1] ?? "Unknown";

  return (
    <div className="flex flex-col gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-gray-900 rounded-lg border border-gray-700"
      >
        {/* Render each allocated node */}
        {nodes.map((node) => {
          const { cx, cy } = toSvg(node.x, node.y);
          const type = node.type ?? "normal";
          const color = NODE_COLORS[type] ?? NODE_COLORS.normal;
          const r = NODE_RADII[type] ?? 2;
          return (
            <circle
              key={node.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              opacity={0.85}
            >
              {node.name && <title>{node.name}</title>}
            </circle>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span className="text-yellow-400 font-semibold">{className}</span>
        <span>{nodes.length} nodes allocated</span>
        {treeVersion && <span>v{treeVersion}</span>}
      </div>

      {/* Node type legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs px-1">
        {(["keystone", "notable", "normal"] as const).map((type) => (
          <span key={type} className="flex items-center gap-1">
            <svg width={8} height={8}>
              <circle cx={4} cy={4} r={3} fill={NODE_COLORS[type]} />
            </svg>
            <span className="text-gray-400 capitalize">{type}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PassiveTree({ tree, width = 600, height = 520 }: PassiveTreeProps) {
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

  const nodes = tree.nodes;

  // If nodes are plain IDs, show the summary ring (old API or fallback)
  if (typeof nodes[0] === "number") {
    const allocatedIds = nodes as number[];
    const className = CLASS_NAMES[tree.classId ?? -1] ?? "Unknown";
    return (
      <div
        style={{ width, height }}
        className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border border-gray-700 gap-6 p-8"
      >
        <svg width={240} height={240} viewBox="0 0 240 240">
          {[90, 70, 50, 30].map((r) => (
            <circle key={r} cx={120} cy={120} r={r} fill="none" stroke="#1f2937" strokeWidth={2} />
          ))}
          <circle
            cx={120}
            cy={120}
            r={90}
            fill="none"
            stroke="#d97706"
            strokeWidth={8}
            strokeDasharray={`${Math.min(allocatedIds.length / 120, 1) * 2 * Math.PI * 90} ${2 * Math.PI * 90}`}
            strokeDashoffset={2 * Math.PI * 90 * 0.25}
            strokeLinecap="round"
            opacity={0.7}
          />
          <text x={120} y={112} textAnchor="middle" fill="#fbbf24" fontSize={32} fontWeight="bold" fontFamily="monospace">
            {allocatedIds.length}
          </text>
          <text x={120} y={134} textAnchor="middle" fill="#9ca3af" fontSize={12} fontFamily="sans-serif">
            nodes allocated
          </text>
        </svg>
        <div className="text-center">
          <div className="text-yellow-400 font-semibold text-sm">{className}</div>
          {tree.treeVersion && (
            <div className="text-gray-600 text-xs mt-1">Tree v{tree.treeVersion}</div>
          )}
        </div>
      </div>
    );
  }

  // Nodes with x/y coordinates — render the actual tree graph
  return (
    <TreeGraph
      nodes={nodes as TreeNodeObj[]}
      width={width}
      height={height}
      classId={tree.classId}
      treeVersion={tree.treeVersion}
    />
  );
}
