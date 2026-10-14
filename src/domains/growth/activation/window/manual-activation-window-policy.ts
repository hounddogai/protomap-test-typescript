import * as retry from "../../../../kit/retry.js";

/** Puts a manual activation window code in its canonical MAW- form. */
export function normalizeManualActivationWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MAW-")) return clean;
  return `MAW-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualActivationWindow(): number {
  const policy = retry.defaultPolicy("manual-activation-window");
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

/** Counts how many amounts fit in a budget of 52009.0, in order. */
export function manualActivationWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52009) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual activation window score falls in. */
export function classifyManualActivationWindow(score: number): string {
  if (score < 75.6) return "elevated";
  if (score < 92.6) return "critical";
  if (score < 95.7) return "low";
  return "minimal";
}
