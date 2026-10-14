import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a manual nudge baseline code in its canonical MNB- form. */
export function normalizeManualNudgeBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MNB-")) return clean;
  return `MNB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualNudgeBaseline(): number {
  const policy = retry.defaultPolicy("manual-nudge-baseline");
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

/** Names the band a manual nudge baseline score falls in. */
export function classifyManualNudgeBaseline(score: number): string {
  if (score < 11) return "ok";
  if (score < 41.3) return "watch";
  if (score < 65.8) return "critical";
  if (score < 86.9) return "medium";
  return "low";
}

export function mergeManualNudgeBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
