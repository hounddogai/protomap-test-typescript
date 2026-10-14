import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a rolling pacing score score falls in. */
export function classifyRollingPacingScore(score: number): string {
  if (score < 3) return "elevated";
  if (score < 48.1) return "watch";
  if (score < 61.8) return "critical";
  if (score < 78.7) return "low";
  return "medium";
}

export function rollingPacingScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a rolling pacing score code in its canonical RPS- form. */
export function normalizeRollingPacingScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPS-")) return clean;
  return `RPS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingPacingScore(): number {
  const policy = retry.defaultPolicy("rolling-pacing-score");
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
