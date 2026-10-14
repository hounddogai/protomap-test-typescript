import { classifyGlobalRetentionTier } from "../../retention/slot/global-retention-tier-policy.js";
import { ManualRetentionLedger } from "../../retention/slot/manual-retention-ledger.js";
import { LegacyActivationEstimate, newLegacyActivationEstimate } from "./legacy-activation-estimate.js";

export function summarizeManualRetentionLedgersForEstimate(items: ManualRetentionLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLegacyActivationEstimatesFromLedger(items: ManualRetentionLedger[]): LegacyActivationEstimate[] {
  const out: LegacyActivationEstimate[] = [];
  for (const item of items) {
    const derived = newLegacyActivationEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyLegacyActivationEstimate(item: LegacyActivationEstimate): string {
  return classifyGlobalRetentionTier(item.adjustedValue());
}
