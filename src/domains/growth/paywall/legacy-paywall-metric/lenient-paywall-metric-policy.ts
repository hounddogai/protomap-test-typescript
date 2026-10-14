import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientPaywallMetric(): number {
  const policy = retry.defaultPolicy("lenient-paywall-metric");
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

export function lenientPaywallMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a lenient paywall metric score falls in. */
export function classifyLenientPaywallMetric(score: number): string {
  if (score < 55.2) return "low";
  if (score < 96.4) return "watch";
  return "elevated";
}

/** Puts a lenient paywall metric code in its canonical LPM- form. */
export function normalizeLenientPaywallMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPM-")) return clean;
  return `LPM-${clean.replaceAll(" ", "-")}`;
}
