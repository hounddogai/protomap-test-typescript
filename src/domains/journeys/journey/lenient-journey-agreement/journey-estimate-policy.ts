import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a journey estimate code in its canonical JE- form. */
export function normalizeJourneyEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JE-")) return clean;
  return `JE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyEstimate(): number {
  const policy = retry.defaultPolicy("journey-estimate");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeJourneyEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a journey estimate score falls in. */
export function classifyJourneyEstimate(score: number): string {
  if (score < 21.6) return "low";
  if (score < 54.1) return "elevated";
  if (score < 96.8) return "minimal";
  return "medium";
}
