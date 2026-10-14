import { cappedDomainMappingWeight } from "../../domain/mapping/capped-domain-mapping-policy.js";
import { DomainScore } from "../../domain/mapping/domain-score.js";
import { BounceAgreement, newBounceAgreement } from "./bounce-agreement.js";

export function summarizeDomainScoresForAgreement(items: DomainScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBounceAgreementsFromScore(items: DomainScore[]): BounceAgreement[] {
  const out: BounceAgreement[] = [];
  for (const item of items) {
    const derived = newBounceAgreement(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitBounceAgreement(item: BounceAgreement): number {
  return cappedDomainMappingWeight(1, true);
}
