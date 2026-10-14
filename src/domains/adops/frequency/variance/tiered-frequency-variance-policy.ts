import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredFrequencyVariance(): number {
  const policy = retry.defaultPolicy("tiered-frequency-variance");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a tiered frequency variance code in its canonical TFV- form. */
export function normalizeTieredFrequencyVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TFV-")) return clean;
  return `TFV-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a tiered frequency variance score falls in. */
export function classifyTieredFrequencyVariance(score: number): string {
  if (score < 23) return "watch";
  if (score < 43.9) return "minimal";
  if (score < 48.4) return "low";
  if (score < 51.7) return "medium";
  return "ok";
}

export function mergeTieredFrequencyVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
