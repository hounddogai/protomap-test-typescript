import * as retry from "../../../../kit/retry.js";

/** Puts a retention slot code in its canonical RS- form. */
export function normalizeRetentionSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RS-")) return clean;
  return `RS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionSlot(): number {
  const policy = retry.defaultPolicy("retention-slot");
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
