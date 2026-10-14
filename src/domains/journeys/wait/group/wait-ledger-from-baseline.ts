import {
  AdaptiveEnrollmentBaseline,
} from "../../enrollment/adaptive-enrollment-digest/adaptive-enrollment-baseline.js";
import {
  primaryEnrollmentDigestBucket,
} from "../../enrollment/adaptive-enrollment-digest/primary-enrollment-digest-policy.js";
import { WaitLedger, newWaitLedger } from "./wait-ledger.js";

export function summarizeAdaptiveEnrollmentBaselinesForLedger(items: AdaptiveEnrollmentBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWaitLedgersFromBaseline(items: AdaptiveEnrollmentBaseline[]): WaitLedger[] {
  const out: WaitLedger[] = [];
  for (const item of items) {
    const derived = newWaitLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWaitLedger(item: WaitLedger): string {
  return primaryEnrollmentDigestBucket(item.projectedVolume());
}
