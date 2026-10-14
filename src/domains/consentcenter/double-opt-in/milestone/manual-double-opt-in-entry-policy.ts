import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual double opt in entry score falls in. */
export function classifyManualDoubleOptInEntry(score: number): string {
  if (score < 28.1) return "low";
  if (score < 32.9) return "watch";
  return "ok";
}

export function mergeManualDoubleOptInEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualDoubleOptInEntry(): number {
  const policy = retry.defaultPolicy("manual-double-opt-in-entry");
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
