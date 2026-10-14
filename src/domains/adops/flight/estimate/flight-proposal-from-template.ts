import { flightManifestWeight } from "../template/flight-manifest-policy.js";
import { FlightTemplate } from "../template/flight-template.js";
import { FlightProposal, newFlightProposal } from "./flight-proposal.js";

export function summarizeFlightTemplatesForProposal(items: FlightTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFlightProposalsFromTemplate(items: FlightTemplate[]): FlightProposal[] {
  const out: FlightProposal[] = [];
  for (const item of items) {
    const derived = newFlightProposal(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignFlightProposal(item: FlightProposal): number {
  return flightManifestWeight(2, true);
}
