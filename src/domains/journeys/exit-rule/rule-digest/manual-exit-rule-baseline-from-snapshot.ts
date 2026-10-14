import {
  globalEnrollmentReviewBucket,
} from "../../enrollment/tiered-enrollment-digest/global-enrollment-review-policy.js";
import { ManualEnrollmentSnapshot } from "../../enrollment/tiered-enrollment-digest/manual-enrollment-snapshot.js";
import { ManualExitRuleBaseline, newManualExitRuleBaseline } from "./manual-exit-rule-baseline.js";

export function summarizeManualEnrollmentSnapshotsForBaseline(items: ManualEnrollmentSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualExitRuleBaselinesFromSnapshot(items: ManualEnrollmentSnapshot[]): ManualExitRuleBaseline[] {
  const out: ManualExitRuleBaseline[] = [];
  for (const item of items) {
    const derived = newManualExitRuleBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceManualExitRuleBaseline(item: ManualExitRuleBaseline): string {
  return globalEnrollmentReviewBucket(item.projectedValue());
}
