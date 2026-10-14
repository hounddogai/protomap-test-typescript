import { strictReplyProposalBucket } from "../../reply/proposal/strict-reply-proposal-policy.js";
import { StrictReplyProposal } from "../../reply/proposal/strict-reply-proposal.js";
import { AdaptivePostDigest, newAdaptivePostDigest } from "./adaptive-post-digest.js";

export function summarizeStrictReplyProposalsForDigest(items: StrictReplyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveAdaptivePostDigestsFromProposal(items: StrictReplyProposal[]): AdaptivePostDigest[] {
  const out: AdaptivePostDigest[] = [];
  for (const item of items) {
    const derived = newAdaptivePostDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeAdaptivePostDigest(item: AdaptivePostDigest): string {
  return strictReplyProposalBucket(item.measuredValue());
}
