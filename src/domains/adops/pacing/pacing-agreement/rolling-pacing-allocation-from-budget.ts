import { RollingFlightBudget } from "../../flight/flight-record/rolling-flight-budget.js";
import { normalizeSeasonalFlightRecordCode } from "../../flight/flight-record/seasonal-flight-record-policy.js";
import { RollingPacingAllocation, newRollingPacingAllocation } from "./rolling-pacing-allocation.js";

export function summarizeRollingFlightBudgetsForAllocation(items: RollingFlightBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingPacingAllocationsFromBudget(items: RollingFlightBudget[]): RollingPacingAllocation[] {
  const out: RollingPacingAllocation[] = [];
  for (const item of items) {
    const derived = newRollingPacingAllocation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRollingPacingAllocation(item: RollingPacingAllocation): string {
  return normalizeSeasonalFlightRecordCode(item.code);
}
