import { stepDraftWeight } from "../../step/record-item/step-draft-policy.js";
import { StepProposal } from "../../step/record-item/step-proposal.js";
import { BranchManifest, newBranchManifest } from "./branch-manifest.js";

export function summarizeStepProposalsForManifest(items: StepProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBranchManifestsFromProposal(items: StepProposal[]): BranchManifest[] {
  const out: BranchManifest[] = [];
  for (const item of items) {
    const derived = newBranchManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBranchManifest(item: BranchManifest): number {
  return stepDraftWeight(8, true);
}
