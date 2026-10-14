import { SuppressionNotice } from "../../suppression/notice/suppression-notice.js";
import { normalizeSuppressionScoreCode } from "../../suppression/notice/suppression-score-policy.js";
import { SubscriptionBudget, newSubscriptionBudget } from "./subscription-budget.js";

export function summarizeSuppressionNoticesForBudget(items: SuppressionNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSubscriptionBudgetsFromNotice(items: SuppressionNotice[]): SubscriptionBudget[] {
  const out: SubscriptionBudget[] = [];
  for (const item of items) {
    const derived = newSubscriptionBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSubscriptionBudget(item: SubscriptionBudget): string {
  return normalizeSuppressionScoreCode(item.code);
}
