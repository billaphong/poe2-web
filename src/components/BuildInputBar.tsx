"use client";

import { useState } from "react";

interface BuildInputBarProps {
  onLoad: (input: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function BuildInputBar({ onLoad, loading, error }: BuildInputBarProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    await onLoad(trimmed);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 0 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste pobb.in URL or build export code…"
          disabled={loading}
          style={{
            flex: 1,
            height: 34,
            padding: "0 12px",
            background: "var(--bg-raised)",
            border: `1px solid ${focused ? "var(--accent-dim)" : "var(--bg-border)"}`,
            borderRight: "none",
            borderRadius: "var(--r-md) 0 0 var(--r-md)",
            color: "var(--fg-primary)",
            fontSize: 12,
            fontFamily: "var(--font-geist, var(--sans))",
            outline: "none",
            transition: "border-color 0.12s",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            height: 34,
            padding: "0 18px",
            background: loading || !input.trim() ? "var(--bg-raised)" : "var(--accent-base)",
            color: loading || !input.trim() ? "var(--fg-faint)" : "var(--bg-app)",
            border: `1px solid ${loading || !input.trim() ? "var(--bg-border)" : "var(--accent-base)"}`,
            borderRadius: "0 var(--r-md) var(--r-md) 0",
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-geist, var(--sans))",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            transition: "background 0.12s, color 0.12s",
            whiteSpace: "nowrap" as const,
          }}
        >
          {loading ? "Loading…" : "Load Build"}
        </button>
      </form>

      {error && (
        <div style={{
          fontSize: 11, padding: "6px 10px",
          background: "var(--state-crit-tint)",
          border: "1px solid var(--state-crit-border)",
          borderTop: "none",
          borderRadius: "0 0 var(--r-md) var(--r-md)",
          color: "var(--state-crit-fg)",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
