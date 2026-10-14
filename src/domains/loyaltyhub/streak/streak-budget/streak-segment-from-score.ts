import { manualRedemptionAgreementWeight } from "../../redemption/adjustment/manual-redemption-agreement-policy.js";
import { RedemptionScore } from "../../redemption/adjustment/redemption-score.js";
import { StreakSegment, newStreakSegment } from "./streak-segment.js";

export function summarizeRedemptionScoresForSegment(items: RedemptionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStreakSegmentsFromScore(items: RedemptionScore[]): StreakSegment[] {
  const out: StreakSegment[] = [];
  for (const item of items) {
    const derived = newStreakSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceStreakSegment(item: StreakSegment): number {
  return manualRedemptionAgreementWeight(3, true);
}
