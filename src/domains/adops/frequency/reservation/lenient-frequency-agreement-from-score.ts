import { normalizeBatchedPlacementDraftCode } from "../../placement/notice/batched-placement-draft-policy.js";
import { WeightedPlacementScore } from "../../placement/notice/weighted-placement-score.js";
import { LenientFrequencyAgreement, newLenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

export function summarizeWeightedPlacementScoresForAgreement(items: WeightedPlacementScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveLenientFrequencyAgreementsFromScore(items: WeightedPlacementScore[]): LenientFrequencyAgreement[] {
  const out: LenientFrequencyAgreement[] = [];
  for (const item of items) {
    const derived = newLenientFrequencyAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLenientFrequencyAgreement(item: LenientFrequencyAgreement): string {
  return normalizeBatchedPlacementDraftCode(item.code);
}
