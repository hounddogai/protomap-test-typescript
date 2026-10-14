import {
  classifyFallbackDoubleOptInBudget,
} from "../../double-opt-in/in-budget/fallback-double-opt-in-budget-policy.js";
import { StrictDoubleOptInException } from "../../double-opt-in/in-budget/strict-double-opt-in-exception.js";
import { TieredSuppressionSegment, newTieredSuppressionSegment } from "./tiered-suppression-segment.js";

export function summarizeStrictDoubleOptInExceptionsForSegment(items: StrictDoubleOptInException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveTieredSuppressionSegmentsFromException(items: StrictDoubleOptInException[]): TieredSuppressionSegment[] {
  const out: TieredSuppressionSegment[] = [];
  for (const item of items) {
    const derived = newTieredSuppressionSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateTieredSuppressionSegment(item: TieredSuppressionSegment): string {
  return classifyFallbackDoubleOptInBudget(item.effectiveLoad());
}
