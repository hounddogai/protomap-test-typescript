import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeModelTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a model target score falls in. */
export function classifyModelTarget(score: number): string {
  if (score < 39.8) return "critical";
  if (score < 50.4) return "high";
  if (score < 90.9) return "ok";
  return "elevated";
}

export function modelTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a model target code in its canonical MT- form. */
export function normalizeModelTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MT-")) return clean;
  return `MT-${clean.replaceAll(" ", "-")}`;
}
