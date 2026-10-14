import { normalizeAdaptiveStreakProposalCode } from "../../streak/request/adaptive-streak-proposal-policy.js";
import { AdaptiveStreakProposal } from "../../streak/request/adaptive-streak-proposal.js";
import { StrictRedemptionWindow, newStrictRedemptionWindow } from "./strict-redemption-window.js";

export function summarizeAdaptiveStreakProposalsForWindow(items: AdaptiveStreakProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStrictRedemptionWindowsFromProposal(items: AdaptiveStreakProposal[]): StrictRedemptionWindow[] {
  const out: StrictRedemptionWindow[] = [];
  for (const item of items) {
    const derived = newStrictRedemptionWindow(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeStrictRedemptionWindow(item: StrictRedemptionWindow): string {
  return normalizeAdaptiveStreakProposalCode(item.code);
}
