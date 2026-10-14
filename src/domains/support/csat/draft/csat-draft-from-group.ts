import { primarySlaCheckpointWeight } from "../../sla/sla-override/primary-sla-checkpoint-policy.js";
import { SlaGroup } from "../../sla/sla-override/sla-group.js";
import { CsatDraft, newCsatDraft } from "./csat-draft.js";

export function summarizeSlaGroupsForDraft(items: SlaGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveCsatDraftsFromGroup(items: SlaGroup[]): CsatDraft[] {
  const out: CsatDraft[] = [];
  for (const item of items) {
    const derived = newCsatDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planCsatDraft(item: CsatDraft): number {
  return primarySlaCheckpointWeight(6, true);
}
