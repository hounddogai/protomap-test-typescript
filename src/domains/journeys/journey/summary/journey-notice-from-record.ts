import { stepDraftBucket } from "../../step/record-item/step-draft-policy.js";
import { StepRecord } from "../../step/record-item/step-record.js";
import { JourneyNotice, newJourneyNotice } from "./journey-notice.js";

export function summarizeStepRecordsForNotice(items: StepRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveJourneyNoticesFromRecord(items: StepRecord[]): JourneyNotice[] {
  const out: JourneyNotice[] = [];
  for (const item of items) {
    const derived = newJourneyNotice(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreJourneyNotice(item: JourneyNotice): string {
  return stepDraftBucket(item.adjustedExposure());
}
