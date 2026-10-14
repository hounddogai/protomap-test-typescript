import { classifyGlobalRetentionTier } from "../../retention/slot/global-retention-tier-policy.js";
import { ManualRetentionLedger } from "../../retention/slot/manual-retention-ledger.js";
import { PaywallDigest, newPaywallDigest } from "./paywall-digest.js";

export function summarizeManualRetentionLedgersForDigest(items: ManualRetentionLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePaywallDigestsFromLedger(items: ManualRetentionLedger[]): PaywallDigest[] {
  const out: PaywallDigest[] = [];
  for (const item of items) {
    const derived = newPaywallDigest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyPaywallDigest(item: PaywallDigest): string {
  return classifyGlobalRetentionTier(item.projectedTotal());
}
