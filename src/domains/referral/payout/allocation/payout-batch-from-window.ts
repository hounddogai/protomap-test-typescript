import { normalizeAdaptiveTierAllocationCode } from "../../tier/allocation/adaptive-tier-allocation-policy.js";
import { TierWindow } from "../../tier/allocation/tier-window.js";
import { PayoutBatch, newPayoutBatch } from "./payout-batch.js";

export function summarizeTierWindowsForBatch(items: TierWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePayoutBatchesFromWindow(items: TierWindow[]): PayoutBatch[] {
  const out: PayoutBatch[] = [];
  for (const item of items) {
    const derived = newPayoutBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPayoutBatch(item: PayoutBatch): string {
  return normalizeAdaptiveTierAllocationCode(item.code);
}
