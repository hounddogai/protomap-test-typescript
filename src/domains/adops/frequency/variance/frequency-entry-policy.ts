import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a frequency entry score falls in. */
export function classifyFrequencyEntry(score: number): string {
  if (score < 47.3) return "medium";
  if (score < 47.4) return "low";
  if (score < 53.3) return "high";
  if (score < 82.2) return "minimal";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyEntry(): number {
  const policy = retry.defaultPolicy("frequency-entry");
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

export function frequencyEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
