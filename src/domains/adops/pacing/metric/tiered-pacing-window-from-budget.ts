import { bidRuleScheduleWeight } from "../../bid-rule/threshold/bid-rule-schedule-policy.js";
import { PendingBidRuleBudget } from "../../bid-rule/threshold/pending-bid-rule-budget.js";
import { TieredPacingWindow, newTieredPacingWindow } from "./tiered-pacing-window.js";

export function summarizePendingBidRuleBudgetsForWindow(items: PendingBidRuleBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveTieredPacingWindowsFromBudget(items: PendingBidRuleBudget[]): TieredPacingWindow[] {
  const out: TieredPacingWindow[] = [];
  for (const item of items) {
    const derived = newTieredPacingWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTieredPacingWindow(item: TieredPacingWindow): number {
  return bidRuleScheduleWeight(2, true);
}
