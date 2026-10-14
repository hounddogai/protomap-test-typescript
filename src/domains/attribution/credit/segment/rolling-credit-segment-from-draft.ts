import { normalizeBatchedConversionSegmentCode } from "../../conversion/quota/batched-conversion-segment-policy.js";
import { ConversionDraft } from "../../conversion/quota/conversion-draft.js";
import { RollingCreditSegment, newRollingCreditSegment } from "./rolling-credit-segment.js";

export function summarizeConversionDraftsForSegment(items: ConversionDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingCreditSegmentsFromDraft(items: ConversionDraft[]): RollingCreditSegment[] {
  const out: RollingCreditSegment[] = [];
  for (const item of items) {
    const derived = newRollingCreditSegment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRollingCreditSegment(item: RollingCreditSegment): string {
  return normalizeBatchedConversionSegmentCode(item.code);
}
