import * as retry from "../../../../kit/retry.js";

/** Puts a leaderboard audit code in its canonical LA- form. */
export function normalizeLeaderboardAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LA-")) return clean;
  return `LA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLeaderboardAudit(): number {
  const policy = retry.defaultPolicy("leaderboard-audit");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
