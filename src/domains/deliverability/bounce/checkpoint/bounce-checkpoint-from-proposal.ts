import { bounceProposalWeight } from "../bounce-plan/bounce-proposal-policy.js";
import { BounceProposal } from "../bounce-plan/bounce-proposal.js";
import { BounceCheckpoint, newBounceCheckpoint } from "./bounce-checkpoint.js";

export function summarizeBounceProposalsForCheckpoint(items: BounceProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBounceCheckpointsFromProposal(items: BounceProposal[]): BounceCheckpoint[] {
  const out: BounceCheckpoint[] = [];
  for (const item of items) {
    const derived = newBounceCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyBounceCheckpoint(item: BounceCheckpoint): number {
  return bounceProposalWeight(7, true);
}
