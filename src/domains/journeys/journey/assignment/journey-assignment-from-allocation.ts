import { ExitRuleAllocation } from "../../exit-rule/exception/exit-rule-allocation.js";
import { exitRuleBundleWeight } from "../../exit-rule/exception/exit-rule-bundle-policy.js";
import { JourneyAssignment, newJourneyAssignment } from "./journey-assignment.js";

export function summarizeExitRuleAllocationsForAssignment(items: ExitRuleAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveJourneyAssignmentsFromAllocation(items: ExitRuleAllocation[]): JourneyAssignment[] {
  const out: JourneyAssignment[] = [];
  for (const item of items) {
    const derived = newJourneyAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveJourneyAssignment(item: JourneyAssignment): number {
  return exitRuleBundleWeight(5, true);
}
