import { normalizeBatchedPayoutBaselineCode } from "../baseline/batched-payout-baseline-policy.js";
import { PayoutVariance } from "../baseline/payout-variance.js";
import { AdaptivePayoutNotice, newAdaptivePayoutNotice } from "./adaptive-payout-notice.js";

export function summarizePayoutVariancesForNotice(items: PayoutVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveAdaptivePayoutNoticesFromVariance(items: PayoutVariance[]): AdaptivePayoutNotice[] {
  const out: AdaptivePayoutNotice[] = [];
  for (const item of items) {
    const derived = newAdaptivePayoutNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyAdaptivePayoutNotice(item: AdaptivePayoutNotice): string {
  return normalizeBatchedPayoutBaselineCode(item.code);
}
