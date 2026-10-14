import * as retry from "../../../../kit/retry.js";

/** Names the band a regional pacing slot score falls in. */
export function classifyRegionalPacingSlot(score: number): string {
  if (score < 18) return "high";
  if (score < 50.9) return "minimal";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalPacingSlot(): number {
  const policy = retry.defaultPolicy("regional-pacing-slot");
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
