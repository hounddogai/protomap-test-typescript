import { DefaultMentionRule } from "../../mention/mention-ledger/default-mention-rule.js";
import { classifyLenientMentionSegment } from "../../mention/mention-ledger/lenient-mention-segment-policy.js";
import { PrimaryInsightPlan, newPrimaryInsightPlan } from "./primary-insight-plan.js";

export function summarizeDefaultMentionRulesForPlan(items: DefaultMentionRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePrimaryInsightPlansFromRule(items: DefaultMentionRule[]): PrimaryInsightPlan[] {
  const out: PrimaryInsightPlan[] = [];
  for (const item of items) {
    const derived = newPrimaryInsightPlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computePrimaryInsightPlan(item: PrimaryInsightPlan): string {
  return classifyLenientMentionSegment(item.netLoad());
}
