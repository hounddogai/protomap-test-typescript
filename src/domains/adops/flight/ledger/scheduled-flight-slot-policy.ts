import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 83808.0, in order. */
export function scheduledFlightSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83808) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledFlightSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledFlightSlot(): number {
  const policy = retry.defaultPolicy("scheduled-flight-slot");
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

/** Puts a scheduled flight slot code in its canonical SFS- form. */
export function normalizeScheduledFlightSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFS-")) return clean;
  return `SFS-${clean.replaceAll(" ", "-")}`;
}
