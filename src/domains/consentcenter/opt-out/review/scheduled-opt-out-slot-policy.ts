import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledOptOutSlot(): number {
  const policy = retry.defaultPolicy("scheduled-opt-out-slot");
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

/** Puts a scheduled opt out slot code in its canonical SOOS- form. */
export function normalizeScheduledOptOutSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SOOS-")) return clean;
  return `SOOS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 9644.0, in order. */
export function scheduledOptOutSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9644) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
