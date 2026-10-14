import {
  adaptiveComplaintMappingBucket,
} from "../../complaint/complaint-mapping/adaptive-complaint-mapping-policy.js";
import { AdaptiveComplaintMapping } from "../../complaint/complaint-mapping/adaptive-complaint-mapping.js";
import { SenderBatch, newSenderBatch } from "./sender-batch.js";

export function summarizeAdaptiveComplaintMappingsForBatch(items: AdaptiveComplaintMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSenderBatchesFromMapping(items: AdaptiveComplaintMapping[]): SenderBatch[] {
  const out: SenderBatch[] = [];
  for (const item of items) {
    const derived = newSenderBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySenderBatch(item: SenderBatch): string {
  return adaptiveComplaintMappingBucket(item.adjustedExposure());
}
