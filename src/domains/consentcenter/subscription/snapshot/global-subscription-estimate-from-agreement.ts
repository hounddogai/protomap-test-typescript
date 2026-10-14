import { normalizeWeightedProofAgreementCode } from "../../proof/summary/weighted-proof-agreement-policy.js";
import { WeightedProofAgreement } from "../../proof/summary/weighted-proof-agreement.js";
import { GlobalSubscriptionEstimate, newGlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

export function summarizeWeightedProofAgreementsForEstimate(items: WeightedProofAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveGlobalSubscriptionEstimatesFromAgreement(items: WeightedProofAgreement[]): GlobalSubscriptionEstimate[] {
  const out: GlobalSubscriptionEstimate[] = [];
  for (const item of items) {
    const derived = newGlobalSubscriptionEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateGlobalSubscriptionEstimate(item: GlobalSubscriptionEstimate): string {
  return normalizeWeightedProofAgreementCode(item.code);
}
