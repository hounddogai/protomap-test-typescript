import { classifyBatchedComplaintWindow } from "../../complaint/window/batched-complaint-window-policy.js";
import { GlobalComplaintDraft } from "../../complaint/window/global-complaint-draft.js";
import { LegacyDomainBatch, newLegacyDomainBatch } from "./legacy-domain-batch.js";

export function summarizeGlobalComplaintDraftsForBatch(items: GlobalComplaintDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLegacyDomainBatchesFromDraft(items: GlobalComplaintDraft[]): LegacyDomainBatch[] {
  const out: LegacyDomainBatch[] = [];
  for (const item of items) {
    const derived = newLegacyDomainBatch(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLegacyDomainBatch(item: LegacyDomainBatch): string {
  return classifyBatchedComplaintWindow(item.effectiveValue());
}
