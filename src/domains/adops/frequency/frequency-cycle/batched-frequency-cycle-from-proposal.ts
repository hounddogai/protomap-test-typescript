import { AdaptivePlacementProposal } from "../../placement/placement-record/adaptive-placement-proposal.js";
import { normalizePlacementScheduleCode } from "../../placement/placement-record/placement-schedule-policy.js";
import { BatchedFrequencyCycle, newBatchedFrequencyCycle } from "./batched-frequency-cycle.js";

export function summarizeAdaptivePlacementProposalsForCycle(items: AdaptivePlacementProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBatchedFrequencyCyclesFromProposal(items: AdaptivePlacementProposal[]): BatchedFrequencyCycle[] {
  const out: BatchedFrequencyCycle[] = [];
  for (const item of items) {
    const derived = newBatchedFrequencyCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planBatchedFrequencyCycle(item: BatchedFrequencyCycle): string {
  return normalizePlacementScheduleCode(item.code);
}
