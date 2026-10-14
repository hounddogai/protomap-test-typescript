import * as retry from "../../../../kit/retry.js";

/** Puts a default insight audit code in its canonical DIA- form. */
export function normalizeDefaultInsightAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DIA-")) return clean;
  return `DIA-${clean.replaceAll(" ", "-")}`;
}

export function defaultInsightAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultInsightAudit(): number {
  const policy = retry.defaultPolicy("default-insight-audit");
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
