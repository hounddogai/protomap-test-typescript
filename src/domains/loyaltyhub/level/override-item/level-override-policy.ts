import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeLevelOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a level override code in its canonical LO- form. */
export function normalizeLevelOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LO-")) return clean;
  return `LO-${clean.replaceAll(" ", "-")}`;
}

export function levelOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function levelOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
