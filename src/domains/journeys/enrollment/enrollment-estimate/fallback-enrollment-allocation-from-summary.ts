import { normalizeLegacyWaitReservationCode } from "../../wait/metric/legacy-wait-reservation-policy.js";
import { PendingWaitSummary } from "../../wait/metric/pending-wait-summary.js";
import { FallbackEnrollmentAllocation, newFallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

export function summarizePendingWaitSummariesForAllocation(items: PendingWaitSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackEnrollmentAllocationsFromSummary(items: PendingWaitSummary[]): FallbackEnrollmentAllocation[] {
  const out: FallbackEnrollmentAllocation[] = [];
  for (const item of items) {
    const derived = newFallbackEnrollmentAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFallbackEnrollmentAllocation(item: FallbackEnrollmentAllocation): string {
  return normalizeLegacyWaitReservationCode(item.code);
}
