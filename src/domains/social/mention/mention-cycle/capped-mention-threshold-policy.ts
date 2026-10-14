import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedMentionThreshold(): number {
  const policy = retry.defaultPolicy("capped-mention-threshold");
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

/** Puts a capped mention threshold code in its canonical CMT- form. */
export function normalizeCappedMentionThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CMT-")) return clean;
  return `CMT-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedMentionThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped mention threshold score falls in. */
export function classifyCappedMentionThreshold(score: number): string {
  if (score < 11.1) return "medium";
  if (score < 42) return "elevated";
  if (score < 83.4) return "minimal";
  return "low";
}
