import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive sender request score falls in. */
export function classifyAdaptiveSenderRequest(score: number): string {
  if (score < 52.9) return "watch";
  if (score < 84.2) return "ok";
  return "minimal";
}

/** Puts a adaptive sender request code in its canonical ASR- form. */
export function normalizeAdaptiveSenderRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASR-")) return clean;
  return `ASR-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveSenderRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeAdaptiveSenderRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
