import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy cohort claim code in its canonical LCC- form. */
export function normalizeLegacyCohortClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCC-")) return clean;
  return `LCC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy cohort claim score falls in. */
export function classifyLegacyCohortClaim(score: number): string {
  if (score < 62.9) return "watch";
  if (score < 67) return "minimal";
  if (score < 75.3) return "high";
  return "low";
}

export function mergeLegacyCohortClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyCohortClaim(): number {
  const policy = retry.defaultPolicy("legacy-cohort-claim");
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
