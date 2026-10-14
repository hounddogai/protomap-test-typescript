import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedTouchpointSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a capped touchpoint summary code in its canonical CTS- form. */
export function normalizeCappedTouchpointSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CTS-")) return clean;
  return `CTS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedTouchpointSummary(): number {
  const policy = retry.defaultPolicy("capped-touchpoint-summary");
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

export function cappedTouchpointSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
