import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeModelAudit(): number {
  const policy = retry.defaultPolicy("model-audit");
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

/** Puts a model audit code in its canonical MA- form. */
export function normalizeModelAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MA-")) return clean;
  return `MA-${clean.replaceAll(" ", "-")}`;
}
