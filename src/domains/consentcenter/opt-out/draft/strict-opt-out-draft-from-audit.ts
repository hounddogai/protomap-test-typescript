import { lenientOptOutBatchWeight } from "../tier/lenient-opt-out-batch-policy.js";
import { OptOutAudit } from "../tier/opt-out-audit.js";
import { StrictOptOutDraft, newStrictOptOutDraft } from "./strict-opt-out-draft.js";

export function summarizeOptOutAuditsForDraft(items: OptOutAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStrictOptOutDraftsFromAudit(items: OptOutAudit[]): StrictOptOutDraft[] {
  const out: StrictOptOutDraft[] = [];
  for (const item of items) {
    const derived = newStrictOptOutDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleStrictOptOutDraft(item: StrictOptOutDraft): number {
  return lenientOptOutBatchWeight(4, true);
}
