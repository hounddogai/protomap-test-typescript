import { LenientCreditProposal } from "../adaptive-credit-slot/lenient-credit-proposal.js";
import { pendingCreditVarianceWeight } from "../adaptive-credit-slot/pending-credit-variance-policy.js";
import { CreditTarget, newCreditTarget } from "./credit-target.js";

export function summarizeLenientCreditProposalsForTarget(items: LenientCreditProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCreditTargetsFromProposal(items: LenientCreditProposal[]): CreditTarget[] {
  const out: CreditTarget[] = [];
  for (const item of items) {
    const derived = newCreditTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCreditTarget(item: CreditTarget): number {
  return pendingCreditVarianceWeight(8, true);
}
