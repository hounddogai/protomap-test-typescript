import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy insight segment score falls in. */
export function classifyLegacyInsightSegment(score: number): string {
  if (score < 56.6) return "medium";
  if (score < 71.8) return "critical";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyInsightSegment(): number {
  const policy = retry.defaultPolicy("legacy-insight-segment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeLegacyInsightSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a legacy insight segment code in its canonical LIS- form. */
export function normalizeLegacyInsightSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LIS-")) return clean;
  return `LIS-${clean.replaceAll(" ", "-")}`;
}
