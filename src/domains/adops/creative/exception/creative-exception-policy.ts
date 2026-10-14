import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a creative exception code in its canonical CE- form. */
export function normalizeCreativeExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CE-")) return clean;
  return `CE-${clean.replaceAll(" ", "-")}`;
}

export function mergeCreativeExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function creativeExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
