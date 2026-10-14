import { BadgeMapping } from "../../badge/mapping/badge-mapping.js";
import { badgePreferenceWeight } from "../../badge/mapping/badge-preference-policy.js";
import { ChallengeRule, newChallengeRule } from "./challenge-rule.js";

export function summarizeBadgeMappingsForRule(items: BadgeMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveChallengeRulesFromMapping(items: BadgeMapping[]): ChallengeRule[] {
  const out: ChallengeRule[] = [];
  for (const item of items) {
    const derived = newChallengeRule(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileChallengeRule(item: ChallengeRule): number {
  return badgePreferenceWeight(4, true);
}
