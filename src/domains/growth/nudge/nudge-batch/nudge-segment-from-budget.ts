import { normalizeRegionalActivationBudgetCode } from "../../activation/digest/regional-activation-budget-policy.js";
import { RegionalActivationBudget } from "../../activation/digest/regional-activation-budget.js";
import { NudgeSegment, newNudgeSegment } from "./nudge-segment.js";

export function summarizeRegionalActivationBudgetsForSegment(items: RegionalActivationBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveNudgeSegmentsFromBudget(items: RegionalActivationBudget[]): NudgeSegment[] {
  const out: NudgeSegment[] = [];
  for (const item of items) {
    const derived = newNudgeSegment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleNudgeSegment(item: NudgeSegment): string {
  return normalizeRegionalActivationBudgetCode(item.code);
}
