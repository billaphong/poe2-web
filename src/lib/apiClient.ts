import type {
  BuildInfo,
  BuildStats,
  TreeData,
  SkillGroup,
  ItemData,
  LoadBuildResponse,
} from "@/types/build";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://poe2-engine-production.up.railway.app";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || `API error ${res.status} at ${path}`);
  }

  return json as T;
}

export async function loadBuild(input: string): Promise<LoadBuildResponse> {
  let body: Record<string, string>;
  if (input.startsWith("http://") || input.startsWith("https://")) {
    body = { pobb_url: input };
  } else if (/^[A-Za-z0-9_-]{4,20}$/.test(input)) {
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

export async function fetchAllBuildData() {
  const [info, stats, tree, skills, items] = await Promise.all([
    fetchBuildInfo(),
    fetchStats(),
    fetchTree(),
    fetchSkills(),
    fetchItems(),
  ]);
  return { info, stats, tree, skills, items };
}
