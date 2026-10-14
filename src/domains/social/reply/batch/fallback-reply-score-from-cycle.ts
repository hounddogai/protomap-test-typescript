import { manualMentionClaimWeight } from "../../mention/mention-cycle/manual-mention-claim-policy.js";
import { WeightedMentionCycle } from "../../mention/mention-cycle/weighted-mention-cycle.js";
import { FallbackReplyScore, newFallbackReplyScore } from "./fallback-reply-score.js";

export function summarizeWeightedMentionCyclesForScore(items: WeightedMentionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackReplyScoresFromCycle(items: WeightedMentionCycle[]): FallbackReplyScore[] {
  const out: FallbackReplyScore[] = [];
  for (const item of items) {
    const derived = newFallbackReplyScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectFallbackReplyScore(item: FallbackReplyScore): number {
  return manualMentionClaimWeight(7, true);
}
