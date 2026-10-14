import { GlobalReputationProposal } from "../adjustment/global-reputation-proposal.js";
import { reputationCheckpointWeight } from "../adjustment/reputation-checkpoint-policy.js";
import { ReputationGroup, newReputationGroup } from "./reputation-group.js";

export function summarizeGlobalReputationProposalsForGroup(items: GlobalReputationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveReputationGroupsFromProposal(items: GlobalReputationProposal[]): ReputationGroup[] {
  const out: ReputationGroup[] = [];
  for (const item of items) {
    const derived = newReputationGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateReputationGroup(item: ReputationGroup): number {
  return reputationCheckpointWeight(5, true);
}
