import { ConversionAgreement } from "../../conversion/rule/conversion-agreement.js";
import { primaryConversionRuleWeight } from "../../conversion/rule/primary-conversion-rule-policy.js";
import { WeightedWindowGroup, newWeightedWindowGroup } from "./weighted-window-group.js";

export function summarizeConversionAgreementsForGroup(items: ConversionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedWindowGroupsFromAgreement(items: ConversionAgreement[]): WeightedWindowGroup[] {
  const out: WeightedWindowGroup[] = [];
  for (const item of items) {
    const derived = newWeightedWindowGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedWindowGroup(item: WeightedWindowGroup): number {
  return primaryConversionRuleWeight(3, true);
}
