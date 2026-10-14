import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergePendingLevelCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pendingLevelCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending level cycle code in its canonical PLC- form. */
export function normalizePendingLevelCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PLC-")) return clean;
  return `PLC-${clean.replaceAll(" ", "-")}`;
}
