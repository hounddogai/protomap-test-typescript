import { BranchCycle } from "../../branch/exception/branch-cycle.js";
import { normalizeBranchEstimateCode } from "../../branch/exception/branch-estimate-policy.js";
import { JourneyRollup, newJourneyRollup } from "./journey-rollup.js";

export function summarizeBranchCyclesForRollup(items: BranchCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveJourneyRollupsFromCycle(items: BranchCycle[]): JourneyRollup[] {
  const out: JourneyRollup[] = [];
  for (const item of items) {
    const derived = newJourneyRollup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateJourneyRollup(item: JourneyRollup): string {
  return normalizeBranchEstimateCode(item.code);
}
