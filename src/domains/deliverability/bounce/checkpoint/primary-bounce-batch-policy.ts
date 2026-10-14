import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a primary bounce batch score falls in. */
export function classifyPrimaryBounceBatch(score: number): string {
  if (score < 14) return "watch";
  if (score < 14.1) return "low";
  return "ok";
}

/** Puts a primary bounce batch code in its canonical PBB- form. */
export function normalizePrimaryBounceBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBB-")) return clean;
  return `PBB-${clean.replaceAll(" ", "-")}`;
}

export function mergePrimaryBounceBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function primaryBounceBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
