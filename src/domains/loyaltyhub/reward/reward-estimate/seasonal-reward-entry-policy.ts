import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function seasonalRewardEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalRewardEntry(): number {
  const policy = retry.defaultPolicy("seasonal-reward-entry");
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

/** Names the band a seasonal reward entry score falls in. */
export function classifySeasonalRewardEntry(score: number): string {
  if (score < 18.3) return "critical";
  if (score < 18.5) return "low";
  if (score < 31.1) return "elevated";
  if (score < 48.6) return "ok";
  return "high";
}

/** Puts a seasonal reward entry code in its canonical SRE- form. */
export function normalizeSeasonalRewardEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRE-")) return clean;
  return `SRE-${clean.replaceAll(" ", "-")}`;
}
