import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergePendingPacingCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a pending pacing checkpoint code in its canonical PPC- form. */
export function normalizePendingPacingCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPC-")) return clean;
  return `PPC-${clean.replaceAll(" ", "-")}`;
}

export function pendingPacingCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
