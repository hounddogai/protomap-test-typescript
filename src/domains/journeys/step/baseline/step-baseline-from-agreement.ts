import { classifyRollingJourneyAgreement } from "../../journey/journey-rollup/rolling-journey-agreement-policy.js";
import { RollingJourneyAgreement } from "../../journey/journey-rollup/rolling-journey-agreement.js";
import { StepBaseline, newStepBaseline } from "./step-baseline.js";

export function summarizeRollingJourneyAgreementsForBaseline(items: RollingJourneyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveStepBaselinesFromAgreement(items: RollingJourneyAgreement[]): StepBaseline[] {
  const out: StepBaseline[] = [];
  for (const item of items) {
    const derived = newStepBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeStepBaseline(item: StepBaseline): string {
  return classifyRollingJourneyAgreement(item.effectiveValue());
}
