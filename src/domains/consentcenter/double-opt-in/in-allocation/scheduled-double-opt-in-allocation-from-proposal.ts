import {
  classifyPrimarySuppressionProposal,
} from "../../suppression/batched-suppression-proposal/primary-suppression-proposal-policy.js";
import {
  PrimarySuppressionProposal,
} from "../../suppression/batched-suppression-proposal/primary-suppression-proposal.js";
import {
  ScheduledDoubleOptInAllocation,
  newScheduledDoubleOptInAllocation,
} from "./scheduled-double-opt-in-allocation.js";

export function summarizePrimarySuppressionProposalsForAllocation(items: PrimarySuppressionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveScheduledDoubleOptInAllocationsFromProposal(items: PrimarySuppressionProposal[]): ScheduledDoubleOptInAllocation[] {
  const out: ScheduledDoubleOptInAllocation[] = [];
  for (const item of items) {
    const derived = newScheduledDoubleOptInAllocation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveScheduledDoubleOptInAllocation(item: ScheduledDoubleOptInAllocation): string {
  return classifyPrimarySuppressionProposal(item.weightedLoad());
}
