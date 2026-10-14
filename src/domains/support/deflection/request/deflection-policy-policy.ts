import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a deflection policy score falls in. */
export function classifyDeflectionPolicy(score: number): string {
  if (score < 19.9) return "critical";
  if (score < 22.7) return "minimal";
  if (score < 42) return "medium";
  return "low";
}

/** Puts a deflection policy code in its canonical DP- form. */
export function normalizeDeflectionPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DP-")) return clean;
  return `DP-${clean.replaceAll(" ", "-")}`;
}

export function mergeDeflectionPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
