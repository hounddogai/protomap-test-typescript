import { CsatAgreement } from "../../csat/record-item/csat-agreement.js";
import { classifyDefaultCsatRecord } from "../../csat/record-item/default-csat-record-policy.js";
import { AdaptiveTicketViewDigest, newAdaptiveTicketViewDigest } from "./adaptive-ticket-view-digest.js";

export function summarizeCsatAgreementsForDigest(items: CsatAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveAdaptiveTicketViewDigestsFromAgreement(items: CsatAgreement[]): AdaptiveTicketViewDigest[] {
  const out: AdaptiveTicketViewDigest[] = [];
  for (const item of items) {
    const derived = newAdaptiveTicketViewDigest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitAdaptiveTicketViewDigest(item: AdaptiveTicketViewDigest): string {
  return classifyDefaultCsatRecord(item.projectedExposure());
}
