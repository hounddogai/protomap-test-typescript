import { PlacementProposal } from "../../placement/segment/placement-proposal.js";
import { scheduledPlacementSegmentWeight } from "../../placement/segment/scheduled-placement-segment-policy.js";
import { FlightProfile, newFlightProfile } from "./flight-profile.js";

export function summarizePlacementProposalsForProfile(items: PlacementProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveFlightProfilesFromProposal(items: PlacementProposal[]): FlightProfile[] {
  const out: FlightProfile[] = [];
  for (const item of items) {
    const derived = newFlightProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleFlightProfile(item: FlightProfile): number {
  return scheduledPlacementSegmentWeight(8, true);
}
