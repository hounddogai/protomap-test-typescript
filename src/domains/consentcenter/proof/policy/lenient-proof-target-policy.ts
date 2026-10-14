import * as retry from "../../../../kit/retry.js";

/** Puts a lenient proof target code in its canonical LPT- form. */
export function normalizeLenientProofTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPT-")) return clean;
  return `LPT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientProofTarget(): number {
  const policy = retry.defaultPolicy("lenient-proof-target");
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

export function lenientProofTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
