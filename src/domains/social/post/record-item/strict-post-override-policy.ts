import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function strictPostOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict post override code in its canonical SPO- form. */
export function normalizeStrictPostOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPO-")) return clean;
  return `SPO-${clean.replaceAll(" ", "-")}`;
}

export function mergeStrictPostOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
