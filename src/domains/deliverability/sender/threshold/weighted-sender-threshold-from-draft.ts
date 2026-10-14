import { CappedReputationDraft } from "../../reputation/draft/capped-reputation-draft.js";
import { reputationCycleWeight } from "../../reputation/draft/reputation-cycle-policy.js";
import { WeightedSenderThreshold, newWeightedSenderThreshold } from "./weighted-sender-threshold.js";

export function summarizeCappedReputationDraftsForThreshold(items: CappedReputationDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWeightedSenderThresholdsFromDraft(items: CappedReputationDraft[]): WeightedSenderThreshold[] {
  const out: WeightedSenderThreshold[] = [];
  for (const item of items) {
    const derived = newWeightedSenderThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedSenderThreshold(item: WeightedSenderThreshold): number {
  return reputationCycleWeight(8, true);
}
