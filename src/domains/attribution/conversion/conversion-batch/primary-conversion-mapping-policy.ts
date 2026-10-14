import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function primaryConversionMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryConversionMapping(): number {
  const policy = retry.defaultPolicy("primary-conversion-mapping");
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

/** Puts a primary conversion mapping code in its canonical PCM- form. */
export function normalizePrimaryConversionMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCM-")) return clean;
  return `PCM-${clean.replaceAll(" ", "-")}`;
}

export function mergePrimaryConversionMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
