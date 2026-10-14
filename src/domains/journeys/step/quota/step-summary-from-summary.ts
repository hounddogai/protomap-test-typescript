import { normalizeJourneyPolicyCode } from "../../journey/score/journey-policy-policy.js";
import { JourneySummary } from "../../journey/score/journey-summary.js";
import { StepSummary, newStepSummary } from "./step-summary.js";

export function summarizeJourneySummariesForSummary(items: JourneySummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStepSummariesFromSummary(items: JourneySummary[]): StepSummary[] {
  const out: StepSummary[] = [];
  for (const item of items) {
    const derived = newStepSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveStepSummary(item: StepSummary): string {
  return normalizeJourneyPolicyCode(item.code);
}
