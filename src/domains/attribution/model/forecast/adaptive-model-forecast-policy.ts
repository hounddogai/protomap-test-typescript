import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveModelForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a adaptive model forecast code in its canonical AMF- form. */
export function normalizeAdaptiveModelForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AMF-")) return clean;
  return `AMF-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveModelForecast(): number {
  const policy = retry.defaultPolicy("adaptive-model-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a adaptive model forecast score falls in. */
export function classifyAdaptiveModelForecast(score: number): string {
  if (score < 12.9) return "critical";
  if (score < 29.4) return "high";
  return "low";
}
