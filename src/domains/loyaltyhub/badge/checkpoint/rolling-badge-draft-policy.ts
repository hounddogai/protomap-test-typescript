import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingBadgeDraft(): number {
  const policy = retry.defaultPolicy("rolling-badge-draft");
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

/** Puts a rolling badge draft code in its canonical RBD- form. */
export function normalizeRollingBadgeDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBD-")) return clean;
  return `RBD-${clean.replaceAll(" ", "-")}`;
}
