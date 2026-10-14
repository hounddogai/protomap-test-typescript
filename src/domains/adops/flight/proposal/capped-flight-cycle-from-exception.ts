import { classifyGlobalPacingAllocation } from "../../pacing/exception/global-pacing-allocation-policy.js";
import { WeightedPacingException } from "../../pacing/exception/weighted-pacing-exception.js";
import { CappedFlightCycle, newCappedFlightCycle } from "./capped-flight-cycle.js";

export function summarizeWeightedPacingExceptionsForCycle(items: WeightedPacingException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveCappedFlightCyclesFromException(items: WeightedPacingException[]): CappedFlightCycle[] {
  const out: CappedFlightCycle[] = [];
  for (const item of items) {
    const derived = newCappedFlightCycle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyCappedFlightCycleExtra(item: CappedFlightCycle): string {
  return classifyGlobalPacingAllocation(item.netExposure());
}
