import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched conversion bundle score falls in. */
export function classifyBatchedConversionBundle(score: number): string {
  if (score < 27.5) return "low";
  if (score < 60.9) return "high";
  if (score < 95.9) return "medium";
  return "watch";
}

/** Puts a batched conversion bundle code in its canonical BCB- form. */
export function normalizeBatchedConversionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCB-")) return clean;
  return `BCB-${clean.replaceAll(" ", "-")}`;
}

export function mergeBatchedConversionBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedConversionBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
