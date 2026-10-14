import { DefaultPlacementMilestone } from "../../placement/review/default-placement-milestone.js";
import { strictPlacementSlotWeight } from "../../placement/review/strict-placement-slot-policy.js";
import { LenientFlightDraft, newLenientFlightDraft } from "./lenient-flight-draft.js";

export function summarizeDefaultPlacementMilestonesForDraft(items: DefaultPlacementMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLenientFlightDraftsFromMilestone(items: DefaultPlacementMilestone[]): LenientFlightDraft[] {
  const out: LenientFlightDraft[] = [];
  for (const item of items) {
    const derived = newLenientFlightDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLenientFlightDraft(item: LenientFlightDraft): number {
  return strictPlacementSlotWeight(1, true);
}
