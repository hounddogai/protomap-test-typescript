import { classifyChallengeBaseline } from "../../challenge/baseline/challenge-baseline-policy.js";
import { ChallengeBaseline } from "../../challenge/baseline/challenge-baseline.js";
import { BadgeMapping, newBadgeMapping } from "./badge-mapping.js";

export function summarizeChallengeBaselinesForMapping(items: ChallengeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBadgeMappingsFromBaseline(items: ChallengeBaseline[]): BadgeMapping[] {
  const out: BadgeMapping[] = [];
  for (const item of items) {
    const derived = newBadgeMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankBadgeMapping(item: BadgeMapping): string {
  return classifyChallengeBaseline(item.weightedTotal());
}
