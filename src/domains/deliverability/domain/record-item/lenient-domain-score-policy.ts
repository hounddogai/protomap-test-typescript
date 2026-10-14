import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient domain score score falls in. */
export function classifyLenientDomainScore(score: number): string {
  if (score < 6.3) return "elevated";
  if (score < 31.4) return "watch";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientDomainScore(): number {
  const policy = retry.defaultPolicy("lenient-domain-score");
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

export function lenientDomainScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
