import { SeasonalSenderMilestone } from "../../sender/threshold/seasonal-sender-milestone.js";
import { weightedSenderThresholdBucket } from "../../sender/threshold/weighted-sender-threshold-policy.js";
import { StrictComplaintMapping, newStrictComplaintMapping } from "./strict-complaint-mapping.js";

export function summarizeSeasonalSenderMilestonesForMapping(items: SeasonalSenderMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictComplaintMappingsFromMilestone(items: SeasonalSenderMilestone[]): StrictComplaintMapping[] {
  const out: StrictComplaintMapping[] = [];
  for (const item of items) {
    const derived = newStrictComplaintMapping(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateStrictComplaintMapping(item: StrictComplaintMapping): string {
  return weightedSenderThresholdBucket(item.projectedLoad());
}
