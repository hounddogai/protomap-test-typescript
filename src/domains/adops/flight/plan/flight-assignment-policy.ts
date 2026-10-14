import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a flight assignment code in its canonical FA- form. */
export function normalizeFlightAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FA-")) return clean;
  return `FA-${clean.replaceAll(" ", "-")}`;
}

export function mergeFlightAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function flightAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightAssignment(): number {
  const policy = retry.defaultPolicy("flight-assignment");
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
