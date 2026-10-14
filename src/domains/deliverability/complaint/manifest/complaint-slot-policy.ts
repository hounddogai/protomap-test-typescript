import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintSlot(): number {
  const policy = retry.defaultPolicy("complaint-slot");
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

/** Names the band a complaint slot score falls in. */
export function classifyComplaintSlot(score: number): string {
  if (score < 3.1) return "ok";
  if (score < 17.3) return "elevated";
  if (score < 26) return "low";
  if (score < 99.5) return "critical";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 83647.0, in order. */
export function complaintSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83647) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
