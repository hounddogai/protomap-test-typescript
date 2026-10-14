import { normalizeDoubleOptInReviewCode } from "../../double-opt-in/segment/double-opt-in-review-policy.js";
import { SeasonalDoubleOptInSegment } from "../../double-opt-in/segment/seasonal-double-opt-in-segment.js";
import { PrimaryPreferenceProposal, newPrimaryPreferenceProposal } from "./primary-preference-proposal.js";

export function summarizeSeasonalDoubleOptInSegmentsForProposal(items: SeasonalDoubleOptInSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePrimaryPreferenceProposalsFromSegment(items: SeasonalDoubleOptInSegment[]): PrimaryPreferenceProposal[] {
  const out: PrimaryPreferenceProposal[] = [];
  for (const item of items) {
    const derived = newPrimaryPreferenceProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computePrimaryPreferenceProposal(item: PrimaryPreferenceProposal): string {
  return normalizeDoubleOptInReviewCode(item.code);
}
