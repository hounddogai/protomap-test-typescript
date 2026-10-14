import { defaultJourneyAgreementWeight } from "../../journey/journey-agreement/default-journey-agreement-policy.js";
import { DefaultJourneyAgreement } from "../../journey/journey-agreement/default-journey-agreement.js";
import { StrictBranchMilestone, newStrictBranchMilestone } from "./strict-branch-milestone.js";

export function summarizeDefaultJourneyAgreementsForMilestone(items: DefaultJourneyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStrictBranchMilestonesFromAgreement(items: DefaultJourneyAgreement[]): StrictBranchMilestone[] {
  const out: StrictBranchMilestone[] = [];
  for (const item of items) {
    const derived = newStrictBranchMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleStrictBranchMilestone(item: StrictBranchMilestone): number {
  return defaultJourneyAgreementWeight(6, true);
}
