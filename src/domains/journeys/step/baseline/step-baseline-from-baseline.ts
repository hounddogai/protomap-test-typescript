import { waitDraftBucket } from "../../wait/draft/wait-draft-policy.js";
import { WeightedWaitBaseline } from "../../wait/draft/weighted-wait-baseline.js";
import { StepBaseline, newStepBaseline } from "./step-baseline.js";

export function summarizeWeightedWaitBaselinesForBaseline(items: WeightedWaitBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveStepBaselinesFromBaseline(items: WeightedWaitBaseline[]): StepBaseline[] {
  const out: StepBaseline[] = [];
  for (const item of items) {
    const derived = newStepBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchStepBaseline(item: StepBaseline): string {
  return waitDraftBucket(item.effectiveValue());
}
