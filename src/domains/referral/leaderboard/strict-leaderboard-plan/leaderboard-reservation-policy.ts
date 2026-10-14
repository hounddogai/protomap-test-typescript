import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLeaderboardReservation(): number {
  const policy = retry.defaultPolicy("leaderboard-reservation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a leaderboard reservation code in its canonical LR- form. */
export function normalizeLeaderboardReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LR-")) return clean;
  return `LR-${clean.replaceAll(" ", "-")}`;
}
