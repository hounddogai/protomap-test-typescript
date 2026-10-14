import * as retry from "../../../../kit/retry.js";

export function weightedLeaderboardPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a weighted leaderboard plan score falls in. */
export function classifyWeightedLeaderboardPlan(score: number): string {
  if (score < 47.6) return "elevated";
  if (score < 51.3) return "minimal";
  return "high";
}

/** Puts a weighted leaderboard plan code in its canonical WLP- form. */
export function normalizeWeightedLeaderboardPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WLP-")) return clean;
  return `WLP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedLeaderboardPlan(): number {
  const policy = retry.defaultPolicy("weighted-leaderboard-plan");
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
