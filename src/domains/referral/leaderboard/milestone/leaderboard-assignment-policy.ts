import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 33629.0, in order. */
export function leaderboardAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33629) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function leaderboardAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a leaderboard assignment code in its canonical LA- form. */
export function normalizeLeaderboardAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LA-")) return clean;
  return `LA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLeaderboardAssignment(): number {
  const policy = retry.defaultPolicy("leaderboard-assignment");
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
