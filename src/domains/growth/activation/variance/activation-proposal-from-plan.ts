import { RetentionPlan } from "../../retention/forecast/retention-plan.js";
import { retentionRequestBucket } from "../../retention/forecast/retention-request-policy.js";
import { ActivationProposal, newActivationProposal } from "./activation-proposal.js";

export function summarizeRetentionPlansForProposal(items: RetentionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveActivationProposalsFromPlan(items: RetentionPlan[]): ActivationProposal[] {
  const out: ActivationProposal[] = [];
  for (const item of items) {
    const derived = newActivationProposal(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeActivationProposal(item: ActivationProposal): string {
  return retentionRequestBucket(item.netTotal());
}
