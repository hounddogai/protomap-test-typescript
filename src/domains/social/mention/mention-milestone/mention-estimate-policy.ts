import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMentionEstimate(): number {
  const policy = retry.defaultPolicy("mention-estimate");
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

export function mentionEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a mention estimate score falls in. */
export function classifyMentionEstimate(score: number): string {
  if (score < 70.7) return "ok";
  if (score < 74.8) return "medium";
  return "elevated";
}
