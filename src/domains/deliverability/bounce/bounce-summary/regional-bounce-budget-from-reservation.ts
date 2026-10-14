import { batchedWarmupExceptionWeight } from "../../warmup/exception/batched-warmup-exception-policy.js";
import { BatchedWarmupReservation } from "../../warmup/exception/batched-warmup-reservation.js";
import { RegionalBounceBudget, newRegionalBounceBudget } from "./regional-bounce-budget.js";

export function summarizeBatchedWarmupReservationsForBudget(items: BatchedWarmupReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalBounceBudgetsFromReservation(items: BatchedWarmupReservation[]): RegionalBounceBudget[] {
  const out: RegionalBounceBudget[] = [];
  for (const item of items) {
    const derived = newRegionalBounceBudget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planRegionalBounceBudget(item: RegionalBounceBudget): number {
  return batchedWarmupExceptionWeight(3, true);
}
