import { pendingSlaLedgerBucket } from "../../sla/mapping/pending-sla-ledger-policy.js";
import { PrimarySlaMapping } from "../../sla/mapping/primary-sla-mapping.js";
import { CsatProfile, newCsatProfile } from "./csat-profile.js";

export function summarizePrimarySlaMappingsForProfile(items: PrimarySlaMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCsatProfilesFromMapping(items: PrimarySlaMapping[]): CsatProfile[] {
  const out: CsatProfile[] = [];
  for (const item of items) {
    const derived = newCsatProfile(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileCsatProfile(item: CsatProfile): string {
  return pendingSlaLedgerBucket(item.weightedValue());
}
