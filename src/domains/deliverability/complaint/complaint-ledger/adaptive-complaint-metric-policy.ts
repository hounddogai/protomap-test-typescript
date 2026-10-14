import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function adaptiveComplaintMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveComplaintMetric(): number {
  const policy = retry.defaultPolicy("adaptive-complaint-metric");
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

export function mergeAdaptiveComplaintMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a adaptive complaint metric code in its canonical ACM- form. */
export function normalizeAdaptiveComplaintMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACM-")) return clean;
  return `ACM-${clean.replaceAll(" ", "-")}`;
}
