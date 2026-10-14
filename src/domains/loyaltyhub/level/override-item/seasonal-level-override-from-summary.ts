import { ManualChallengeSummary } from "../../challenge/primary-challenge-override/manual-challenge-summary.js";
import {
  pendingChallengeTemplateWeight,
} from "../../challenge/primary-challenge-override/pending-challenge-template-policy.js";
import { SeasonalLevelOverride, newSeasonalLevelOverride } from "./seasonal-level-override.js";

export function summarizeManualChallengeSummariesForOverride(items: ManualChallengeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSeasonalLevelOverridesFromSummary(items: ManualChallengeSummary[]): SeasonalLevelOverride[] {
  const out: SeasonalLevelOverride[] = [];
  for (const item of items) {
    const derived = newSeasonalLevelOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalLevelOverride(item: SeasonalLevelOverride): number {
  return pendingChallengeTemplateWeight(7, true);
}
