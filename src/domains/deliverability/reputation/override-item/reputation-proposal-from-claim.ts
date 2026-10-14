import { TieredWarmupClaim } from "../../warmup/claim/tiered-warmup-claim.js";
import { warmupLedgerWeight } from "../../warmup/claim/warmup-ledger-policy.js";
import { ReputationProposal, newReputationProposal } from "./reputation-proposal.js";

export function summarizeTieredWarmupClaimsForProposal(items: TieredWarmupClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveReputationProposalsFromClaim(items: TieredWarmupClaim[]): ReputationProposal[] {
  const out: ReputationProposal[] = [];
  for (const item of items) {
    const derived = newReputationProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyReputationProposal(item: ReputationProposal): number {
  return warmupLedgerWeight(4, true);
}
