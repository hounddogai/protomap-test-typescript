import { manualPayoutPlanBucket } from "../metric/manual-payout-plan-policy.js";
import { ManualPayoutPlan } from "../metric/manual-payout-plan.js";
import { LegacyPayoutBundle, newLegacyPayoutBundle } from "./legacy-payout-bundle.js";

export function summarizeManualPayoutPlansForBundle(items: ManualPayoutPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLegacyPayoutBundlesFromPlan(items: ManualPayoutPlan[]): LegacyPayoutBundle[] {
  const out: LegacyPayoutBundle[] = [];
  for (const item of items) {
    const derived = newLegacyPayoutBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planLegacyPayoutBundle(item: LegacyPayoutBundle): string {
  return manualPayoutPlanBucket(item.measuredValue());
}
