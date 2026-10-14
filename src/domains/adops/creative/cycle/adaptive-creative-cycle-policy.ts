import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a adaptive creative cycle code in its canonical ACC- form. */
export function normalizeAdaptiveCreativeCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACC-")) return clean;
  return `ACC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive creative cycle score falls in. */
export function classifyAdaptiveCreativeCycle(score: number): string {
  if (score < 11.1) return "critical";
  if (score < 26.8) return "low";
  if (score < 92.3) return "ok";
  if (score < 97.5) return "minimal";
  return "medium";
}

export function mergeAdaptiveCreativeCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
