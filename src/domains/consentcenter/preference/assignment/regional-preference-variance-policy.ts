import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalPreferenceVariance(): number {
  const policy = retry.defaultPolicy("regional-preference-variance");
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

/** Puts a regional preference variance code in its canonical RPV- form. */
export function normalizeRegionalPreferenceVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPV-")) return clean;
  return `RPV-${clean.replaceAll(" ", "-")}`;
}

export function mergeRegionalPreferenceVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
