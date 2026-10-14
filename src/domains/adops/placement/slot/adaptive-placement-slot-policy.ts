import * as retry from "../../../../kit/retry.js";

/** Puts a adaptive placement slot code in its canonical APS- form. */
export function normalizeAdaptivePlacementSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APS-")) return clean;
  return `APS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePlacementSlot(): number {
  const policy = retry.defaultPolicy("adaptive-placement-slot");
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

export function adaptivePlacementSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
