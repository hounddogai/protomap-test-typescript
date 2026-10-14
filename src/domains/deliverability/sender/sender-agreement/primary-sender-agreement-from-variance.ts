import { domainBaselineWeight } from "../../domain/target/domain-baseline-policy.js";
import { DomainVariance } from "../../domain/target/domain-variance.js";
import { PrimarySenderAgreement, newPrimarySenderAgreement } from "./primary-sender-agreement.js";

export function summarizeDomainVariancesForAgreement(items: DomainVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimarySenderAgreementsFromVariance(items: DomainVariance[]): PrimarySenderAgreement[] {
  const out: PrimarySenderAgreement[] = [];
  for (const item of items) {
    const derived = newPrimarySenderAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitPrimarySenderAgreement(item: PrimarySenderAgreement): number {
  return domainBaselineWeight(7, true);
}
