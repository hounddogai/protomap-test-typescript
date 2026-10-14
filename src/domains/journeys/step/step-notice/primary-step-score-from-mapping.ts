import { normalizeStepMappingCode } from "../group/step-mapping-policy.js";
import { StepMapping } from "../group/step-mapping.js";
import { PrimaryStepScore, newPrimaryStepScore } from "./primary-step-score.js";

export function summarizeStepMappingsForScore(items: StepMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function derivePrimaryStepScoresFromMapping(items: StepMapping[]): PrimaryStepScore[] {
  const out: PrimaryStepScore[] = [];
  for (const item of items) {
    const derived = newPrimaryStepScore(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePrimaryStepScore(item: PrimaryStepScore): string {
  return normalizeStepMappingCode(item.code);
}
