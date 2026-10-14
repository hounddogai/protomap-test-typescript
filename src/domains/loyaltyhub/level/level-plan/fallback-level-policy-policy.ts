import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackLevelPolicy(): number {
  const policy = retry.defaultPolicy("fallback-level-policy");
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

export function mergeFallbackLevelPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a fallback level policy code in its canonical FLP- form. */
export function normalizeFallbackLevelPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FLP-")) return clean;
  return `FLP-${clean.replaceAll(" ", "-")}`;
}

export function fallbackLevelPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
