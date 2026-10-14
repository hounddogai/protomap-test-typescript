import { classifyFlightProfile } from "../../flight/estimate/flight-profile-policy.js";
import { FlightProposal } from "../../flight/estimate/flight-proposal.js";
import { RegionalFrequencyDraft, newRegionalFrequencyDraft } from "./regional-frequency-draft.js";

export function summarizeFlightProposalsForDraft(items: FlightProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRegionalFrequencyDraftsFromProposal(items: FlightProposal[]): RegionalFrequencyDraft[] {
  const out: RegionalFrequencyDraft[] = [];
  for (const item of items) {
    const derived = newRegionalFrequencyDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleRegionalFrequencyDraft(item: RegionalFrequencyDraft): string {
  return classifyFlightProfile(item.projectedExposure());
}
