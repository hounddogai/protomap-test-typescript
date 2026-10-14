import { WeightedWindowProposal } from "../../window/proposal/weighted-window-proposal.js";
import { windowClaimWeight } from "../../window/proposal/window-claim-policy.js";
import { RollingTouchpointTemplate, newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

export function summarizeWeightedWindowProposalsForTemplate(items: WeightedWindowProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRollingTouchpointTemplatesFromProposal(items: WeightedWindowProposal[]): RollingTouchpointTemplate[] {
  const out: RollingTouchpointTemplate[] = [];
  for (const item of items) {
    const derived = newRollingTouchpointTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeRollingTouchpointTemplate(item: RollingTouchpointTemplate): number {
  return windowClaimWeight(1, true);
}
