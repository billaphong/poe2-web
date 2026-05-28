import type {
  BuildInfo,
  BuildStats,
  TreeData,
  SkillGroup,
  ItemData,
  LoadBuildResponse,
  TreePositionNode,
} from "@/types/build";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://poe2-engine-production.up.railway.app";

async function apiFetch<T>(path: string, options?: RequestInit, retries = 4): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });

  const json = await res.json();

  // Lua engine is single-threaded — retry with backoff if a request raced
  if (json.error?.includes("Concurrent") && retries > 0) {
    await new Promise(r => setTimeout(r, 800));
    return apiFetch<T>(path, options, retries - 1);
  }

  if (!res.ok || json.error) {
    throw new Error(json.error || `API error ${res.status} at ${path}`);
  }

  return json as T;
}

export async function loadBuild(input: string): Promise<LoadBuildResponse> {
  let body: Record<string, string>;
  if (input.startsWith("http://") || input.startsWith("https://")) {
    body = { pobb_url: input };
  } else if (/^[A-Za-z0-9_=+-]{4,200}$/.test(input) && !input.trimStart().startsWith("<")) {
    // pobb.in share codes can be up to ~100 chars (base64url encoded)
    body = { pobb_code: input };
  } else {
    body = { build_xml: input };
  }

  return apiFetch<LoadBuildResponse>("/api/build/load", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchStats(): Promise<BuildStats> {
  const data = await apiFetch<{ ok: boolean; stats: BuildStats }>(
    "/api/build/stats"
  );
  return data.stats;
}

export async function fetchBuildInfo(): Promise<BuildInfo> {
  const data = await apiFetch<{ ok: boolean; info: BuildInfo }>(
    "/api/build/info"
  );
  return data.info;
}

export async function fetchTree(): Promise<TreeData> {
  const data = await apiFetch<{ ok: boolean; tree: TreeData }>(
    "/api/build/tree"
  );
  return data.tree;
}

export async function fetchSkills(): Promise<SkillGroup[]> {
  const data = await apiFetch<{ ok: boolean; skills: SkillGroup[] }>(
    "/api/build/skills"
  );
  return data.skills;
}

export async function fetchItems(): Promise<ItemData[]> {
  const data = await apiFetch<{ ok: boolean; items: ItemData[] }>(
    "/api/build/items"
  );
  return data.items;
}

export async function fetchTreePositions(): Promise<TreePositionNode[]> {
  const data = await apiFetch<{ ok: boolean; nodes: TreePositionNode[] }>("/api/tree-positions");
  return data.nodes;
}

export async function fetchAllBuildData() {
  // Sequential — the Lua engine is single-threaded and rejects concurrent requests
  const info = await fetchBuildInfo();
  const stats = await fetchStats();
  const tree = await fetchTree();
  const treePositions = await fetchTreePositions();
  const skills = await fetchSkills();
  const items = await fetchItems();
  return { info, stats, tree, treePositions, skills, items };
}
