import { LegacyMentionMilestone } from "../../mention/mention-milestone/legacy-mention-milestone.js";
import { mentionEstimateBucket } from "../../mention/mention-milestone/mention-estimate-policy.js";
import { WeightedInsightPlan, newWeightedInsightPlan } from "./weighted-insight-plan.js";

export function summarizeLegacyMentionMilestonesForPlan(items: LegacyMentionMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedInsightPlansFromMilestone(items: LegacyMentionMilestone[]): WeightedInsightPlan[] {
  const out: WeightedInsightPlan[] = [];
  for (const item of items) {
    const derived = newWeightedInsightPlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedInsightPlan(item: WeightedInsightPlan): string {
  return mentionEstimateBucket(item.projectedLoad());
}
