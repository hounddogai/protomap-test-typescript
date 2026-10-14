import * as retry from "../../../../kit/retry.js";

/** Names the band a nudge checkpoint score falls in. */
export function classifyNudgeCheckpoint(score: number): string {
  if (score < 14.3) return "low";
  if (score < 88.4) return "elevated";
  if (score < 96.8) return "watch";
  return "high";
}

/** Puts a nudge checkpoint code in its canonical NC- form. */
export function normalizeNudgeCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NC-")) return clean;
  return `NC-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeNudgeCheckpoint(): number {
  const policy = retry.defaultPolicy("nudge-checkpoint");
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
