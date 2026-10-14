import {
  globalEnrollmentReviewBucket,
} from "../../enrollment/tiered-enrollment-digest/global-enrollment-review-policy.js";
import { ScheduledEnrollmentRule } from "../../enrollment/tiered-enrollment-digest/scheduled-enrollment-rule.js";
import { ScheduledBranchLedger, newScheduledBranchLedger } from "./scheduled-branch-ledger.js";

export function summarizeScheduledEnrollmentRulesForLedger(items: ScheduledEnrollmentRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveScheduledBranchLedgersFromRule(items: ScheduledEnrollmentRule[]): ScheduledBranchLedger[] {
  const out: ScheduledBranchLedger[] = [];
  for (const item of items) {
    const derived = newScheduledBranchLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeScheduledBranchLedger(item: ScheduledBranchLedger): string {
  return globalEnrollmentReviewBucket(item.weightedValue());
}
