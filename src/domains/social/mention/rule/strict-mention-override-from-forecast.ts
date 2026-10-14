import { MentionForecast } from "../forecast/mention-forecast.js";
import { rollingMentionTierWeight } from "../forecast/rolling-mention-tier-policy.js";
import { StrictMentionOverride, newStrictMentionOverride } from "./strict-mention-override.js";

export function summarizeMentionForecastsForOverride(items: MentionForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveStrictMentionOverridesFromForecast(items: MentionForecast[]): StrictMentionOverride[] {
  const out: StrictMentionOverride[] = [];
  for (const item of items) {
    const derived = newStrictMentionOverride(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyStrictMentionOverrideExtra(item: StrictMentionOverride): number {
  return rollingMentionTierWeight(7, true);
}
