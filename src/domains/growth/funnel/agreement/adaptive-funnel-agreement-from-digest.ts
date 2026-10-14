import { LegacyRetentionDigest } from "../../retention/retention-checkpoint/legacy-retention-digest.js";
import {
  manualRetentionProposalWeight,
} from "../../retention/retention-checkpoint/manual-retention-proposal-policy.js";
import { AdaptiveFunnelAgreement, newAdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

export function summarizeLegacyRetentionDigestsForAgreement(items: LegacyRetentionDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveAdaptiveFunnelAgreementsFromDigest(items: LegacyRetentionDigest[]): AdaptiveFunnelAgreement[] {
  const out: AdaptiveFunnelAgreement[] = [];
  for (const item of items) {
    const derived = newAdaptiveFunnelAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planAdaptiveFunnelAgreement(item: AdaptiveFunnelAgreement): number {
  return manualRetentionProposalWeight(5, true);
}
