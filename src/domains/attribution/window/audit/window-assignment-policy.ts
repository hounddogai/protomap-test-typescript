import * as retry from "../../../../kit/retry.js";

/** Puts a window assignment code in its canonical WA- form. */
export function normalizeWindowAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WA-")) return clean;
  return `WA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWindowAssignment(): number {
  const policy = retry.defaultPolicy("window-assignment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
