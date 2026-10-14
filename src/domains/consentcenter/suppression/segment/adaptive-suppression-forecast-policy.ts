import * as retry from "../../../../kit/retry.js";

export function adaptiveSuppressionForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveSuppressionForecast(): number {
  const policy = retry.defaultPolicy("adaptive-suppression-forecast");
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

/** Names the band a adaptive suppression forecast score falls in. */
export function classifyAdaptiveSuppressionForecast(score: number): string {
  if (score < 64.2) return "watch";
  if (score < 98.4) return "minimal";
  return "elevated";
}

/** Puts a adaptive suppression forecast code in its canonical ASF- form. */
export function normalizeAdaptiveSuppressionForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASF-")) return clean;
  return `ASF-${clean.replaceAll(" ", "-")}`;
}
