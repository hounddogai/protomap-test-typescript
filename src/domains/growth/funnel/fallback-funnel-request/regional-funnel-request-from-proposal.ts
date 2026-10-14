import { AdaptiveActivationProposal } from "../../activation/proposal/adaptive-activation-proposal.js";
import { lenientActivationMetricWeight } from "../../activation/proposal/lenient-activation-metric-policy.js";
import { RegionalFunnelRequest, newRegionalFunnelRequest } from "./regional-funnel-request.js";

export function summarizeAdaptiveActivationProposalsForRequest(items: AdaptiveActivationProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalFunnelRequestsFromProposal(items: AdaptiveActivationProposal[]): RegionalFunnelRequest[] {
  const out: RegionalFunnelRequest[] = [];
  for (const item of items) {
    const derived = newRegionalFunnelRequest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeRegionalFunnelRequest(item: RegionalFunnelRequest): number {
  return lenientActivationMetricWeight(8, true);
}
