import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientActivationSchedule(): number {
  const policy = retry.defaultPolicy("lenient-activation-schedule");
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

export function mergeLenientActivationScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient activation schedule code in its canonical LAS- form. */
export function normalizeLenientActivationScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LAS-")) return clean;
  return `LAS-${clean.replaceAll(" ", "-")}`;
}

export function lenientActivationScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
