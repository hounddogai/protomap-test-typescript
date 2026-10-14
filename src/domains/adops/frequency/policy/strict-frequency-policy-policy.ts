import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictFrequencyPolicy(): number {
  const policy = retry.defaultPolicy("strict-frequency-policy");
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

/** Names the band a strict frequency policy score falls in. */
export function classifyStrictFrequencyPolicy(score: number): string {
  if (score < 26.9) return "watch";
  if (score < 27.9) return "ok";
  if (score < 55.1) return "high";
  if (score < 93.9) return "elevated";
  return "low";
}

export function mergeStrictFrequencyPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict frequency policy code in its canonical SFP- form. */
export function normalizeStrictFrequencyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFP-")) return clean;
  return `SFP-${clean.replaceAll(" ", "-")}`;
}
