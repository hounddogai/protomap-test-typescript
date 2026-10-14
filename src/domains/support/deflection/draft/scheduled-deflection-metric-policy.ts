import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled deflection metric score falls in. */
export function classifyScheduledDeflectionMetric(score: number): string {
  if (score < 33.2) return "ok";
  if (score < 83.6) return "high";
  if (score < 86.7) return "elevated";
  if (score < 90.7) return "critical";
  return "watch";
}

export function mergeScheduledDeflectionMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledDeflectionMetric(): number {
  const policy = retry.defaultPolicy("scheduled-deflection-metric");
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

/** Puts a scheduled deflection metric code in its canonical SDM- form. */
export function normalizeScheduledDeflectionMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDM-")) return clean;
  return `SDM-${clean.replaceAll(" ", "-")}`;
}
