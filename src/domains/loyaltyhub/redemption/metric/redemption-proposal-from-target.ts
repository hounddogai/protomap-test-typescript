import { streakTargetWeight } from "../../streak/target/streak-target-policy.js";
import { StreakTarget } from "../../streak/target/streak-target.js";
import { RedemptionProposal, newRedemptionProposal } from "./redemption-proposal.js";

export function summarizeStreakTargetsForProposal(items: StreakTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRedemptionProposalsFromTarget(items: StreakTarget[]): RedemptionProposal[] {
  const out: RedemptionProposal[] = [];
  for (const item of items) {
    const derived = newRedemptionProposal(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRedemptionProposal(item: RedemptionProposal): number {
  return streakTargetWeight(9, true);
}
