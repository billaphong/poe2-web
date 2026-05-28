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
  allocated: boolean;
  isKeystone?: boolean;
  isNotable?: boolean;
  isMastery?: boolean;
  icon?: string;
}

export interface TreeData {
  nodes: TreeNode[];
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
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
  slot?: string;
  rarity?: string;
  affixes?: string[];
  requirements?: Record<string, number>;
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
  skills: SkillGroup[];
  items: ItemData[];
}
