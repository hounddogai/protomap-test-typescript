import { creativeMappingBucket } from "../../creative/mapping/creative-mapping-policy.js";
import { CreativeMapping } from "../../creative/mapping/creative-mapping.js";
import { CappedFrequencyReview, newCappedFrequencyReview } from "./capped-frequency-review.js";

export function summarizeCreativeMappingsForReview(items: CreativeMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveCappedFrequencyReviewsFromMapping(items: CreativeMapping[]): CappedFrequencyReview[] {
  const out: CappedFrequencyReview[] = [];
  for (const item of items) {
    const derived = newCappedFrequencyReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankCappedFrequencyReview(item: CappedFrequencyReview): string {
  return creativeMappingBucket(item.netExposure());
}
