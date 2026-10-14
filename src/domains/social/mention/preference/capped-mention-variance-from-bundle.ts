import { classifyDefaultReplyProposal } from "../../reply/policy/default-reply-proposal-policy.js";
import { ReplyBundle } from "../../reply/policy/reply-bundle.js";
import { CappedMentionVariance, newCappedMentionVariance } from "./capped-mention-variance.js";

export function summarizeReplyBundlesForVariance(items: ReplyBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedMentionVariancesFromBundle(items: ReplyBundle[]): CappedMentionVariance[] {
  const out: CappedMentionVariance[] = [];
  for (const item of items) {
    const derived = newCappedMentionVariance(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyCappedMentionVariance(item: CappedMentionVariance): string {
  return classifyDefaultReplyProposal(item.adjustedExposure());
}
