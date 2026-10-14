import { classifyWarmupBudget } from "../../warmup/preference/warmup-budget-policy.js";
import { WarmupClaim } from "../../warmup/preference/warmup-claim.js";
import { ComplaintCycle, newComplaintCycle } from "./complaint-cycle.js";

export function summarizeWarmupClaimsForCycle(items: WarmupClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveComplaintCyclesFromClaim(items: WarmupClaim[]): ComplaintCycle[] {
  const out: ComplaintCycle[] = [];
  for (const item of items) {
    const derived = newComplaintCycle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchComplaintCycle(item: ComplaintCycle): string {
  return classifyWarmupBudget(item.effectiveTotal());
}
