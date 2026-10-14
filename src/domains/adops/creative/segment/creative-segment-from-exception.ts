import { BidRuleException } from "../../bid-rule/manifest/bid-rule-exception.js";
import { weightedBidRuleEstimateBucket } from "../../bid-rule/manifest/weighted-bid-rule-estimate-policy.js";
import { CreativeSegment, newCreativeSegment } from "./creative-segment.js";

export function summarizeBidRuleExceptionsForSegment(items: BidRuleException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreativeSegmentsFromException(items: BidRuleException[]): CreativeSegment[] {
  const out: CreativeSegment[] = [];
  for (const item of items) {
    const derived = newCreativeSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCreativeSegment(item: CreativeSegment): string {
  return weightedBidRuleEstimateBucket(item.adjustedValue());
}
