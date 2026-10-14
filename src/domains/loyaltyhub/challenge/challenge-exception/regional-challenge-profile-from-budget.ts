import { FallbackLevelBudget } from "../../level/ledger/fallback-level-budget.js";
import { normalizeLevelTemplateCode } from "../../level/ledger/level-template-policy.js";
import { RegionalChallengeProfile, newRegionalChallengeProfile } from "./regional-challenge-profile.js";

export function summarizeFallbackLevelBudgetsForProfile(items: FallbackLevelBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRegionalChallengeProfilesFromBudget(items: FallbackLevelBudget[]): RegionalChallengeProfile[] {
  const out: RegionalChallengeProfile[] = [];
  for (const item of items) {
    const derived = newRegionalChallengeProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateRegionalChallengeProfile(item: RegionalChallengeProfile): string {
  return normalizeLevelTemplateCode(item.code);
}
