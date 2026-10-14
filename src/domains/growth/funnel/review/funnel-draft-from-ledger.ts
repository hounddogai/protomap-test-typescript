import { normalizeActivationClaimCode } from "../../activation/adjustment/activation-claim-policy.js";
import { WeightedActivationLedger } from "../../activation/adjustment/weighted-activation-ledger.js";
import { FunnelDraft, newFunnelDraft } from "./funnel-draft.js";

export function summarizeWeightedActivationLedgersForDraft(items: WeightedActivationLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFunnelDraftsFromLedger(items: WeightedActivationLedger[]): FunnelDraft[] {
  const out: FunnelDraft[] = [];
  for (const item of items) {
    const derived = newFunnelDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceFunnelDraft(item: FunnelDraft): string {
  return normalizeActivationClaimCode(item.code);
}
