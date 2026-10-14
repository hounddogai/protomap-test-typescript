import { stepExceptionWeight } from "../../step/claim/step-exception-policy.js";
import { StepException } from "../../step/claim/step-exception.js";
import { SeasonalWaitAdjustment, newSeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

export function summarizeStepExceptionsForAdjustment(items: StepException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSeasonalWaitAdjustmentsFromException(items: StepException[]): SeasonalWaitAdjustment[] {
  const out: SeasonalWaitAdjustment[] = [];
  for (const item of items) {
    const derived = newSeasonalWaitAdjustment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectSeasonalWaitAdjustment(item: SeasonalWaitAdjustment): number {
  return stepExceptionWeight(2, true);
}
