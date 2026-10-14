import { normalizeWeightedCohortExceptionCode } from "../../cohort/cohort-quota/weighted-cohort-exception-policy.js";
import { WeightedCohortException } from "../../cohort/cohort-quota/weighted-cohort-exception.js";
import { NudgeSegment, newNudgeSegment } from "./nudge-segment.js";

export function summarizeWeightedCohortExceptionsForSegment(items: WeightedCohortException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveNudgeSegmentsFromException(items: WeightedCohortException[]): NudgeSegment[] {
  const out: NudgeSegment[] = [];
  for (const item of items) {
    const derived = newNudgeSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveNudgeSegment(item: NudgeSegment): string {
  return normalizeWeightedCohortExceptionCode(item.code);
}
