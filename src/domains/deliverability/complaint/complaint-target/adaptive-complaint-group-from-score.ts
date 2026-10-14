import { classifyFallbackBounceRollup } from "../../bounce/review/fallback-bounce-rollup-policy.js";
import { LenientBounceScore } from "../../bounce/review/lenient-bounce-score.js";
import { AdaptiveComplaintGroup, newAdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

export function summarizeLenientBounceScoresForGroup(items: LenientBounceScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveComplaintGroupsFromScore(items: LenientBounceScore[]): AdaptiveComplaintGroup[] {
  const out: AdaptiveComplaintGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveComplaintGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateAdaptiveComplaintGroup(item: AdaptiveComplaintGroup): string {
  return classifyFallbackBounceRollup(item.projectedValue());
}
