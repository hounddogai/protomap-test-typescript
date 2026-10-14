import { TouchpointPlan } from "../../touchpoint/proposal/touchpoint-plan.js";
import { touchpointProposalWeight } from "../../touchpoint/proposal/touchpoint-proposal-policy.js";
import { ConversionCycle, newConversionCycle } from "./conversion-cycle.js";

export function summarizeTouchpointPlansForCycle(items: TouchpointPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveConversionCyclesFromPlan(items: TouchpointPlan[]): ConversionCycle[] {
  const out: ConversionCycle[] = [];
  for (const item of items) {
    const derived = newConversionCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeConversionCycle(item: ConversionCycle): number {
  return touchpointProposalWeight(7, true);
}
