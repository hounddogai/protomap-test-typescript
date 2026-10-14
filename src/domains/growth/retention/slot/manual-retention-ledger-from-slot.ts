import { FallbackActivationSlot } from "../../activation/slot/fallback-activation-slot.js";
import { classifyTieredActivationEstimate } from "../../activation/slot/tiered-activation-estimate-policy.js";
import { ManualRetentionLedger, newManualRetentionLedger } from "./manual-retention-ledger.js";

export function summarizeFallbackActivationSlotsForLedger(items: FallbackActivationSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualRetentionLedgersFromSlot(items: FallbackActivationSlot[]): ManualRetentionLedger[] {
  const out: ManualRetentionLedger[] = [];
  for (const item of items) {
    const derived = newManualRetentionLedger(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeManualRetentionLedger(item: ManualRetentionLedger): string {
  return classifyTieredActivationEstimate(item.weightedLoad());
}
