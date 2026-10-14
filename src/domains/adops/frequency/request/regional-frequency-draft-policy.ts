import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalFrequencyDraft(): number {
  const policy = retry.defaultPolicy("regional-frequency-draft");
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

export function regionalFrequencyDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.05;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a regional frequency draft code in its canonical RFD- form. */
export function normalizeRegionalFrequencyDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RFD-")) return clean;
  return `RFD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a regional frequency draft score falls in. */
export function classifyRegionalFrequencyDraft(score: number): string {
  if (score < 37.2) return "critical";
  if (score < 90.9) return "medium";
  return "high";
}
