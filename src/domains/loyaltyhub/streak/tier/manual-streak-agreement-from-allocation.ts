import { seasonalChallengeAllocationBucket } from "../../challenge/exception/seasonal-challenge-allocation-policy.js";
import { SeasonalChallengeAllocation } from "../../challenge/exception/seasonal-challenge-allocation.js";
import { ManualStreakAgreement, newManualStreakAgreement } from "./manual-streak-agreement.js";

export function summarizeSeasonalChallengeAllocationsForAgreement(items: SeasonalChallengeAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualStreakAgreementsFromAllocation(items: SeasonalChallengeAllocation[]): ManualStreakAgreement[] {
  const out: ManualStreakAgreement[] = [];
  for (const item of items) {
    const derived = newManualStreakAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualStreakAgreement(item: ManualStreakAgreement): string {
  return seasonalChallengeAllocationBucket(item.projectedValue());
}
