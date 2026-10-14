import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 84758.0, in order. */
export function seasonalInviteRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84758) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalInviteRequest(): number {
  const policy = retry.defaultPolicy("seasonal-invite-request");
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

/** Puts a seasonal invite request code in its canonical SIR- form. */
export function normalizeSeasonalInviteRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIR-")) return clean;
  return `SIR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal invite request score falls in. */
export function classifySeasonalInviteRequest(score: number): string {
  if (score < 19) return "ok";
  if (score < 91) return "critical";
  return "elevated";
}
