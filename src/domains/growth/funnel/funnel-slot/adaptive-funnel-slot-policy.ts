import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveFunnelSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive funnel slot code in its canonical AFS- form. */
export function normalizeAdaptiveFunnelSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AFS-")) return clean;
  return `AFS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveFunnelSlot(): number {
  const policy = retry.defaultPolicy("adaptive-funnel-slot");
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
