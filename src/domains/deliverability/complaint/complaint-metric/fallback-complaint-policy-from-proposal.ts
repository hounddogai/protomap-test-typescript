import { classifyLegacySenderSnapshot } from "../../sender/sender-snapshot/legacy-sender-snapshot-policy.js";
import { StrictSenderProposal } from "../../sender/sender-snapshot/strict-sender-proposal.js";
import { FallbackComplaintPolicy, newFallbackComplaintPolicy } from "./fallback-complaint-policy.js";

export function summarizeStrictSenderProposalsForPolicy(items: StrictSenderProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveFallbackComplaintPoliciesFromProposal(items: StrictSenderProposal[]): FallbackComplaintPolicy[] {
  const out: FallbackComplaintPolicy[] = [];
  for (const item of items) {
    const derived = newFallbackComplaintPolicy(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planFallbackComplaintPolicy(item: FallbackComplaintPolicy): string {
  return classifyLegacySenderSnapshot(item.effectiveLoad());
}
