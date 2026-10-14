import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a global double opt in notice code in its canonical GDOIN- form. */
export function normalizeGlobalDoubleOptInNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GDOIN-")) return clean;
  return `GDOIN-${clean.replaceAll(" ", "-")}`;
}

export function mergeGlobalDoubleOptInNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function globalDoubleOptInNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalDoubleOptInNotice(): number {
  const policy = retry.defaultPolicy("global-double-opt-in-notice");
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
