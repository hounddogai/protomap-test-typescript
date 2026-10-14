import { adaptiveSenderRequestWeight } from "../../sender/review/adaptive-sender-request-policy.js";
import { AdaptiveSenderTemplate } from "../../sender/review/adaptive-sender-template.js";
import { SeasonalWarmupRule, newSeasonalWarmupRule } from "./seasonal-warmup-rule.js";

export function summarizeAdaptiveSenderTemplatesForRule(items: AdaptiveSenderTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveSeasonalWarmupRulesFromTemplate(items: AdaptiveSenderTemplate[]): SeasonalWarmupRule[] {
  const out: SeasonalWarmupRule[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupRule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceSeasonalWarmupRule(item: SeasonalWarmupRule): number {
  return adaptiveSenderRequestWeight(5, true);
}
