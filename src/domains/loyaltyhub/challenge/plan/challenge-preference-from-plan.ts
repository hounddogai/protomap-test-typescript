import { normalizeBadgeTierCode } from "../../badge/plan/badge-tier-policy.js";
import { TieredBadgePlan } from "../../badge/plan/tiered-badge-plan.js";
import { ChallengePreference, newChallengePreference } from "./challenge-preference.js";

export function summarizeTieredBadgePlansForPreference(items: TieredBadgePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveChallengePreferencesFromPlan(items: TieredBadgePlan[]): ChallengePreference[] {
  const out: ChallengePreference[] = [];
  for (const item of items) {
    const derived = newChallengePreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateChallengePreference(item: ChallengePreference): string {
  return normalizeBadgeTierCode(item.code);
}
