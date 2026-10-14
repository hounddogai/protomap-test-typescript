import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictBounceReservation(): number {
  const policy = retry.defaultPolicy("strict-bounce-reservation");
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

export function strictBounceReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 95650.0, in order. */
export function strictBounceReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95650) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictBounceReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
