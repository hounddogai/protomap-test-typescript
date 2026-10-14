import { preferenceBaselineBucket } from "../../preference/baseline/preference-baseline-policy.js";
import { PreferenceBaseline } from "../../preference/baseline/preference-baseline.js";
import { OptOutProposal, newOptOutProposal } from "./opt-out-proposal.js";

export function summarizePreferenceBaselinesForProposal(items: PreferenceBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveOptOutProposalsFromBaseline(items: PreferenceBaseline[]): OptOutProposal[] {
  const out: OptOutProposal[] = [];
  for (const item of items) {
    const derived = newOptOutProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeOptOutProposal(item: OptOutProposal): string {
  return preferenceBaselineBucket(item.netVolume());
}
