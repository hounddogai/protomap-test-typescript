import {
  globalFraudCheckPreferenceBucket,
} from "../../fraud-check/check-plan/global-fraud-check-preference-policy.js";
import { GlobalFraudCheckPreference } from "../../fraud-check/check-plan/global-fraud-check-preference.js";
import { PayoutAssignment, newPayoutAssignment } from "./payout-assignment.js";

export function summarizeGlobalFraudCheckPreferencesForAssignment(items: GlobalFraudCheckPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePayoutAssignmentsFromPreference(items: GlobalFraudCheckPreference[]): PayoutAssignment[] {
  const out: PayoutAssignment[] = [];
  for (const item of items) {
    const derived = newPayoutAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planPayoutAssignment(item: PayoutAssignment): string {
  return globalFraudCheckPreferenceBucket(item.netValue());
}
