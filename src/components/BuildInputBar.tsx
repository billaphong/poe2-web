"use client";

import { useState } from "react";

interface BuildInputBarProps {
  onLoad: (input: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function BuildInputBar({ onLoad, loading, error }: BuildInputBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    await onLoad(trimmed);
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste pobb.in URL (https://pobb.in/XXXXX) or build export code..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? "Loading..." : "Load Build"}
        </button>
      </form>
      {error && (
        <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
