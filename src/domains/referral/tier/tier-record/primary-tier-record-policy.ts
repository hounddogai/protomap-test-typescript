import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a primary tier record code in its canonical PTR- form. */
export function normalizePrimaryTierRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTR-")) return clean;
  return `PTR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryTierRecord(): number {
  const policy = retry.defaultPolicy("primary-tier-record");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergePrimaryTierRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary tier record score falls in. */
export function classifyPrimaryTierRecord(score: number): string {
  if (score < 1) return "critical";
  if (score < 61.4) return "high";
  return "low";
}
