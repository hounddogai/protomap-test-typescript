import { DefaultComplaintBatch } from "../../complaint/tiered-complaint-mapping/default-complaint-batch.js";
import {
  classifyStrictComplaintMapping,
} from "../../complaint/tiered-complaint-mapping/strict-complaint-mapping-policy.js";
import { LenientSenderDigest, newLenientSenderDigest } from "./lenient-sender-digest.js";

export function summarizeDefaultComplaintBatchesForDigest(items: DefaultComplaintBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLenientSenderDigestsFromBatch(items: DefaultComplaintBatch[]): LenientSenderDigest[] {
  const out: LenientSenderDigest[] = [];
  for (const item of items) {
    const derived = newLenientSenderDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeLenientSenderDigest(item: LenientSenderDigest): string {
  return classifyStrictComplaintMapping(item.effectiveVolume());
}
