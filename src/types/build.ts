export interface BuildInfo {
  name: string;
  level: number;
  class: string;
  ascendancy: string;
}

export interface BuildStats {
  Life?: number;
  EnergyShield?: number;
  Mana?: number;
  Evasion?: number;
  Armour?: number;
  FireResist?: number;
  ColdResist?: number;
  LightningResist?: number;
  ChaosResist?: number;
  ManaRegen?: number;
  LifeRegen?: number;
  [key: string]: number | undefined;
}

export interface TreeNode {
  id: number;
  name?: string;
  x: number;
  y: number;
  type?: "normal" | "notable" | "keystone" | "mastery" | "ascendancy" | "jewel";
  ascendancyName?: string;
}

export interface LuaTreeNode {
  id: number;
  name?: string;
  type?: string;
  x?: number;
  y?: number;
}

export interface TreeData {
  // API may return plain IDs (older forks) or objects with coordinates (newer forks)
  nodes: number[] | LuaTreeNode[];
  classId?: number;
  ascendClassId?: number;
  secondaryAscendClassId?: number;
  treeVersion?: string;
  masteryEffects?: unknown[];
}

export interface SkillGem {
  name: string;
  level: number;
  quality: number;
  enabled: boolean;
}

export interface SkillGroup {
  label?: string;
  gems: SkillGem[];
  enabled: boolean;
}

export interface ItemData {
  id?: number;
  name: string;
  base?: string;
  baseName?: string;
  slot?: string;
  rarity?: string;
  raw?: string;
  affixes?: string[];
  requirements?: Record<string, number>;
}

export interface TreePositionNode {
  id: number;
  x: number;
  y: number;
  type: "keystone" | "notable" | "normal" | "mastery";
  name: string;
  stats: string[];
  connections: number[];
  allocated: boolean;
}

export interface LoadBuildResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface BuildData {
  info: BuildInfo;
  stats: BuildStats;
  tree: TreeData;
  treePositions: TreePositionNode[];
  skills: SkillGroup[];
  items: ItemData[];
}
