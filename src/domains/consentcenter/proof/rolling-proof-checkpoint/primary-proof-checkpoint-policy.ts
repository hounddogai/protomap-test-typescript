import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryProofCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary proof checkpoint score falls in. */
export function classifyPrimaryProofCheckpoint(score: number): string {
  if (score < 7.7) return "critical";
  if (score < 14.3) return "low";
  if (score < 84.6) return "elevated";
  return "minimal";
}

export function primaryProofCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary proof checkpoint code in its canonical PPC- form. */
export function normalizePrimaryProofCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPC-")) return clean;
  return `PPC-${clean.replaceAll(" ", "-")}`;
}
