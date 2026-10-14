import { PendingCsatDraft } from "../../csat/allocation/pending-csat-draft.js";
import { classifyStrictCsatAllocation } from "../../csat/allocation/strict-csat-allocation-policy.js";
import { EscalationManifest, newEscalationManifest } from "./escalation-manifest.js";

export function summarizePendingCsatDraftsForManifest(items: PendingCsatDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveEscalationManifestsFromDraft(items: PendingCsatDraft[]): EscalationManifest[] {
  const out: EscalationManifest[] = [];
  for (const item of items) {
    const derived = newEscalationManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyEscalationManifest(item: EscalationManifest): string {
  return classifyStrictCsatAllocation(item.projectedLoad());
}
