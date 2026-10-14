import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 83936.0, in order. */
export function scheduledFrequencyPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83936) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledFrequencyPlan(): number {
  const policy = retry.defaultPolicy("scheduled-frequency-plan");
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

/** Puts a scheduled frequency plan code in its canonical SFP- form. */
export function normalizeScheduledFrequencyPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFP-")) return clean;
  return `SFP-${clean.replaceAll(" ", "-")}`;
}
