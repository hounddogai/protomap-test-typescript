import * as numbers from "../../../../kit/numbers.js";

export function legacyFunnelDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a legacy funnel draft code in its canonical LFD- form. */
export function normalizeLegacyFunnelDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFD-")) return clean;
  return `LFD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy funnel draft score falls in. */
export function classifyLegacyFunnelDraft(score: number): string {
  if (score < 74.4) return "ok";
  if (score < 75.2) return "critical";
  return "minimal";
}
