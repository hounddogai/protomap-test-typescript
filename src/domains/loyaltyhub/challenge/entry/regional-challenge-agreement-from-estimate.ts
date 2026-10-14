import { DefaultRedemptionEstimate } from "../../redemption/redemption-override/default-redemption-estimate.js";
import {
  classifyRegionalRedemptionDraft,
} from "../../redemption/redemption-override/regional-redemption-draft-policy.js";
import { RegionalChallengeAgreement, newRegionalChallengeAgreement } from "./regional-challenge-agreement.js";

export function summarizeDefaultRedemptionEstimatesForAgreement(items: DefaultRedemptionEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRegionalChallengeAgreementsFromEstimate(items: DefaultRedemptionEstimate[]): RegionalChallengeAgreement[] {
  const out: RegionalChallengeAgreement[] = [];
  for (const item of items) {
    const derived = newRegionalChallengeAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRegionalChallengeAgreement(item: RegionalChallengeAgreement): string {
  return classifyRegionalRedemptionDraft(item.measuredValue());
}
