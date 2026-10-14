import { rollingStepClaimWeight } from "../../step/step-adjustment/rolling-step-claim-policy.js";
import { RollingStepClaim } from "../../step/step-adjustment/rolling-step-claim.js";
import { WaitProposal, newWaitProposal } from "./wait-proposal.js";

export function summarizeRollingStepClaimsForProposal(items: RollingStepClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWaitProposalsFromClaim(items: RollingStepClaim[]): WaitProposal[] {
  const out: WaitProposal[] = [];
  for (const item of items) {
    const derived = newWaitProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceWaitProposal(item: WaitProposal): number {
  return rollingStepClaimWeight(9, true);
}
