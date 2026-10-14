import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a tiered model tier code in its canonical TMT- form. */
export function normalizeTieredModelTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TMT-")) return clean;
  return `TMT-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredModelTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredModelTier(): number {
  const policy = retry.defaultPolicy("tiered-model-tier");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a tiered model tier score falls in. */
export function classifyTieredModelTier(score: number): string {
  if (score < 15.8) return "minimal";
  if (score < 25.1) return "watch";
  if (score < 33.6) return "high";
  return "ok";
}
