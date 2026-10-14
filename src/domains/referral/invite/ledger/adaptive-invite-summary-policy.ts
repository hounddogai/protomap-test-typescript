import * as retry from "../../../../kit/retry.js";

/** Puts a adaptive invite summary code in its canonical AIS- form. */
export function normalizeAdaptiveInviteSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AIS-")) return clean;
  return `AIS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 19626.0, in order. */
export function adaptiveInviteSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19626) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveInviteSummary(): number {
  const policy = retry.defaultPolicy("adaptive-invite-summary");
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
