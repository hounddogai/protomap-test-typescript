import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a nudge manifest code in its canonical NM- form. */
export function normalizeNudgeManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NM-")) return clean;
  return `NM-${clean.replaceAll(" ", "-")}`;
}

export function nudgeManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a nudge manifest score falls in. */
export function classifyNudgeManifest(score: number): string {
  if (score < 19.8) return "critical";
  if (score < 23.8) return "high";
  if (score < 53.2) return "ok";
  if (score < 69.4) return "low";
  return "minimal";
}

export function mergeNudgeManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
