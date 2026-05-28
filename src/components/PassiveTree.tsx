"use client";

interface PassiveTreeProps {
  tree: {
    nodes?: number[] | { x: number; y: number; allocated: boolean }[];
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

export default function PassiveTree({ tree, width = 600, height = 600 }: PassiveTreeProps) {
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

  // If nodes are plain IDs (numbers), show summary view
  if (typeof nodes[0] === "number") {
    const allocatedIds = nodes as number[];
    const className = CLASS_NAMES[tree.classId ?? -1] ?? "Unknown";
    return (
      <div
        style={{ width, height }}
        className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border border-gray-700 gap-6 p-8"
      >
        {/* Radial visualisation — concentric rings representing node count */}
        <svg width={240} height={240} viewBox="0 0 240 240">
          {/* Background rings */}
          {[90, 70, 50, 30].map((r) => (
            <circle key={r} cx={120} cy={120} r={r} fill="none" stroke="#1f2937" strokeWidth={2} />
          ))}
          {/* Fill ring proportional to node count (capped at 120 = full outer ring) */}
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
          {/* Center text */}
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
          <div className="text-gray-500 text-xs mt-3 max-w-[280px] leading-relaxed">
            Full tree coordinates require extended API support.
            Node IDs are available — visual layout coming soon.
          </div>
        </div>
      </div>
    );
  }

  // Future: canvas renderer for nodes with x/y coords
  return (
    <div
      style={{ width, height }}
      className="flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700 text-gray-500 text-sm"
    >
      {nodes.length} nodes allocated
    </div>
  );
}
