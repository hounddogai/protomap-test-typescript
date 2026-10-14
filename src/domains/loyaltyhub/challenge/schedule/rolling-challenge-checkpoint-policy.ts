import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingChallengeCheckpoint(): number {
  const policy = retry.defaultPolicy("rolling-challenge-checkpoint");
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

/** Puts a rolling challenge checkpoint code in its canonical RCC- form. */
export function normalizeRollingChallengeCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCC-")) return clean;
  return `RCC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling challenge checkpoint score falls in. */
export function classifyRollingChallengeCheckpoint(score: number): string {
  if (score < 5.2) return "minimal";
  if (score < 89.7) return "high";
  if (score < 99) return "low";
  return "elevated";
}
