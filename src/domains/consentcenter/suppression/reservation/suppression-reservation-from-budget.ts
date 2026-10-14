import { classifySubscriptionBudget } from "../../subscription/subscription-window/subscription-budget-policy.js";
import { SubscriptionBudget } from "../../subscription/subscription-window/subscription-budget.js";
import { SuppressionReservation, newSuppressionReservation } from "./suppression-reservation.js";

export function summarizeSubscriptionBudgetsForReservation(items: SubscriptionBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSuppressionReservationsFromBudget(items: SubscriptionBudget[]): SuppressionReservation[] {
  const out: SuppressionReservation[] = [];
  for (const item of items) {
    const derived = newSuppressionReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeSuppressionReservation(item: SuppressionReservation): string {
  return classifySubscriptionBudget(item.projectedLoad());
}
