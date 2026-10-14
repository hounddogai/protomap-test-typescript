import { normalizeSlaScoreCode } from "../../sla/score/sla-score-policy.js";
import { SlaScore } from "../../sla/score/sla-score.js";
import { MacroAllocation, newMacroAllocation } from "./macro-allocation.js";

export function summarizeSlaScoresForAllocation(items: SlaScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveMacroAllocationsFromScore(items: SlaScore[]): MacroAllocation[] {
  const out: MacroAllocation[] = [];
  for (const item of items) {
    const derived = newMacroAllocation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitMacroAllocation(item: MacroAllocation): string {
  return normalizeSlaScoreCode(item.code);
}
