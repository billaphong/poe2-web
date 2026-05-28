"use client";

import { useState, useCallback } from "react";
import BuildInputBar from "@/components/BuildInputBar";
import PassiveTree from "@/components/PassiveTree";
import GearSlots from "@/components/GearSlots";
import StatsPanel from "@/components/StatsPanel";
import { loadBuild, fetchAllBuildData } from "@/lib/apiClient";
import type { BuildData } from "@/types/build";

export default function HomePage() {
  const [buildData, setBuildData] = useState<BuildData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);

    try {
      await loadBuild(input);
      const data = await fetchAllBuildData();
      setBuildData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load build. Check the URL or code and try again.";
      setError(message);
      console.error("[handleLoad]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-yellow-500 font-bold text-lg">PoE2</span>
            <span className="text-gray-300 font-semibold">Path of Building</span>
          </div>
          {buildData && (
            <span className="text-xs text-gray-500">
              {buildData.info.class} · Lv {buildData.info.level}
            </span>
          )}
        </div>
      </header>

      <div className="px-6 py-4 border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto">
          <BuildInputBar onLoad={handleLoad} loading={loading} error={error} />
        </div>
      </div>

      <main className="flex-1 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex gap-4 items-start">
          <div className="flex-shrink-0">
            <PassiveTree
              tree={buildData?.tree ?? null}
              width={600}
              height={600}
            />
          </div>

          <div className="flex-1 min-w-[280px] max-w-[340px]">
            <GearSlots items={buildData?.items ?? null} />
          </div>

          <div className="flex-shrink-0 w-[220px]">
            <StatsPanel
              info={buildData?.info ?? null}
              stats={buildData?.stats ?? null}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 px-6 py-3 text-center text-xs text-gray-600">
        Powered by PathOfBuilding-PoE2 · Not affiliated with Grinding Gear Games
      </footer>
    </div>
  );
}
