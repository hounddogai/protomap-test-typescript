import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientFlightSlot(): number {
  const policy = retry.defaultPolicy("lenient-flight-slot");
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

export function lenientFlightSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a lenient flight slot score falls in. */
export function classifyLenientFlightSlot(score: number): string {
  if (score < 5.6) return "medium";
  if (score < 43) return "high";
  if (score < 54.8) return "elevated";
  return "low";
}

/** Puts a lenient flight slot code in its canonical LFS- form. */
export function normalizeLenientFlightSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFS-")) return clean;
  return `LFS-${clean.replaceAll(" ", "-")}`;
}
