import { PaywallLedger } from "../../paywall/summary/paywall-ledger.js";
import { paywallSummaryWeight } from "../../paywall/summary/paywall-summary-policy.js";
import { RetentionDraft, newRetentionDraft } from "./retention-draft.js";

export function summarizePaywallLedgersForDraft(items: PaywallLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRetentionDraftsFromLedger(items: PaywallLedger[]): RetentionDraft[] {
  const out: RetentionDraft[] = [];
  for (const item of items) {
    const derived = newRetentionDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRetentionDraft(item: RetentionDraft): number {
  return paywallSummaryWeight(1, true);
}
