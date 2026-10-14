import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function macroRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a macro request score falls in. */
export function classifyMacroRequest(score: number): string {
  if (score < 43.7) return "critical";
  if (score < 72) return "low";
  if (score < 92) return "high";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMacroRequest(): number {
  const policy = retry.defaultPolicy("macro-request");
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

export function mergeMacroRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
