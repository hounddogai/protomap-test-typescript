import * as retry from "../../../../kit/retry.js";

export function cappedFraudCheckExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a capped fraud check exception code in its canonical CFCE- form. */
export function normalizeCappedFraudCheckExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFCE-")) return clean;
  return `CFCE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedFraudCheckException(): number {
  const policy = retry.defaultPolicy("capped-fraud-check-exception");
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
