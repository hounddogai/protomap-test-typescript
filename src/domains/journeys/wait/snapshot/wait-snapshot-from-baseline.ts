import { normalizeEnrollmentBaselineCode } from "../../enrollment/baseline/enrollment-baseline-policy.js";
import { EnrollmentBaseline } from "../../enrollment/baseline/enrollment-baseline.js";
import { WaitSnapshot, newWaitSnapshot } from "./wait-snapshot.js";

export function summarizeEnrollmentBaselinesForSnapshot(items: EnrollmentBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveWaitSnapshotsFromBaseline(items: EnrollmentBaseline[]): WaitSnapshot[] {
  const out: WaitSnapshot[] = [];
  for (const item of items) {
    const derived = newWaitSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchWaitSnapshot(item: WaitSnapshot): string {
  return normalizeEnrollmentBaselineCode(item.code);
}
