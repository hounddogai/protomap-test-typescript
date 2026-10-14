import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingFlightScore(): number {
  const policy = retry.defaultPolicy("rolling-flight-score");
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

/** Names the band a rolling flight score score falls in. */
export function classifyRollingFlightScore(score: number): string {
  if (score < 2.4) return "critical";
  if (score < 19.4) return "ok";
  return "elevated";
}

/** Puts a rolling flight score code in its canonical RFS- form. */
export function normalizeRollingFlightScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RFS-")) return clean;
  return `RFS-${clean.replaceAll(" ", "-")}`;
}
