import { paywallNoticeBucket } from "../../paywall/proposal/paywall-notice-policy.js";
import { PaywallProposal } from "../../paywall/proposal/paywall-proposal.js";
import { PrimaryNudgeDigest, newPrimaryNudgeDigest } from "./primary-nudge-digest.js";

export function summarizePaywallProposalsForDigest(items: PaywallProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePrimaryNudgeDigestsFromProposal(items: PaywallProposal[]): PrimaryNudgeDigest[] {
  const out: PrimaryNudgeDigest[] = [];
  for (const item of items) {
    const derived = newPrimaryNudgeDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryNudgeDigest(item: PrimaryNudgeDigest): string {
  return paywallNoticeBucket(item.weightedLoad());
}
