import { normalizeGlobalWaitBatchCode } from "../../wait/milestone/global-wait-batch-policy.js";
import { WaitForecast } from "../../wait/milestone/wait-forecast.js";
import { BranchReservation, newBranchReservation } from "./branch-reservation.js";

export function summarizeWaitForecastsForReservation(items: WaitForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBranchReservationsFromForecast(items: WaitForecast[]): BranchReservation[] {
  const out: BranchReservation[] = [];
  for (const item of items) {
    const derived = newBranchReservation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBranchReservation(item: BranchReservation): string {
  return normalizeGlobalWaitBatchCode(item.code);
}
