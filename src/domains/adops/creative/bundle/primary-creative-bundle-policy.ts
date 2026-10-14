import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function primaryCreativeBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a primary creative bundle code in its canonical PCB- form. */
export function normalizePrimaryCreativeBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCB-")) return clean;
  return `PCB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryCreativeBundle(): number {
  const policy = retry.defaultPolicy("primary-creative-bundle");
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

export function mergePrimaryCreativeBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
