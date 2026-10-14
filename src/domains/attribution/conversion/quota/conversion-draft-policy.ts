import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionDraft(): number {
  const policy = retry.defaultPolicy("conversion-draft");
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

/** Puts a conversion draft code in its canonical CD- form. */
export function normalizeConversionDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CD-")) return clean;
  return `CD-${clean.replaceAll(" ", "-")}`;
}

export function mergeConversionDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function conversionDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
