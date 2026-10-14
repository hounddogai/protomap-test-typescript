import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredLeaderboardPlan(): number {
  const policy = retry.defaultPolicy("tiered-leaderboard-plan");
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

/** Puts a tiered leaderboard plan code in its canonical TLP- form. */
export function normalizeTieredLeaderboardPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TLP-")) return clean;
  return `TLP-${clean.replaceAll(" ", "-")}`;
}
