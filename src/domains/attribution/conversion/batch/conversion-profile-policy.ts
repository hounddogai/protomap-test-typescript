import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a conversion profile code in its canonical CP- form. */
export function normalizeConversionProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CP-")) return clean;
  return `CP-${clean.replaceAll(" ", "-")}`;
}

export function mergeConversionProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionProfile(): number {
  const policy = retry.defaultPolicy("conversion-profile");
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

/** Names the band a conversion profile score falls in. */
export function classifyConversionProfile(score: number): string {
  if (score < 25) return "elevated";
  if (score < 25.4) return "minimal";
  if (score < 61.1) return "low";
  if (score < 63.2) return "ok";
  return "critical";
}
