import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledInsightTemplate(): number {
  const policy = retry.defaultPolicy("scheduled-insight-template");
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

export function scheduledInsightTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled insight template code in its canonical SIT- form. */
export function normalizeScheduledInsightTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIT-")) return clean;
  return `SIT-${clean.replaceAll(" ", "-")}`;
}
