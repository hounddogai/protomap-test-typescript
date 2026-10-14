import { journeySummaryWeight } from "../score/journey-summary-policy.js";
import { JourneySummary } from "../score/journey-summary.js";
import { JourneyAgreement, newJourneyAgreement } from "./journey-agreement.js";

export function summarizeJourneySummariesForAgreement(items: JourneySummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveJourneyAgreementsFromSummary(items: JourneySummary[]): JourneyAgreement[] {
  const out: JourneyAgreement[] = [];
  for (const item of items) {
    const derived = newJourneyAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveJourneyAgreement(item: JourneyAgreement): number {
  return journeySummaryWeight(4, true);
}
