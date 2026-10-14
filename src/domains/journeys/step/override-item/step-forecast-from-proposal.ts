import { normalizeJourneyDigestCode } from "../../journey/cycle/journey-digest-policy.js";
import { PrimaryJourneyProposal } from "../../journey/cycle/primary-journey-proposal.js";
import { StepForecast, newStepForecast } from "./step-forecast.js";

export function summarizePrimaryJourneyProposalsForForecast(items: PrimaryJourneyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStepForecastsFromProposal(items: PrimaryJourneyProposal[]): StepForecast[] {
  const out: StepForecast[] = [];
  for (const item of items) {
    const derived = newStepForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleStepForecast(item: StepForecast): string {
  return normalizeJourneyDigestCode(item.code);
}
