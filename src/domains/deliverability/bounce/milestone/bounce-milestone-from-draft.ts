import { globalComplaintDraftBucket } from "../../complaint/window/global-complaint-draft-policy.js";
import { GlobalComplaintDraft } from "../../complaint/window/global-complaint-draft.js";
import { BounceMilestone, newBounceMilestone } from "./bounce-milestone.js";

export function summarizeGlobalComplaintDraftsForMilestone(items: GlobalComplaintDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveBounceMilestonesFromDraft(items: GlobalComplaintDraft[]): BounceMilestone[] {
  const out: BounceMilestone[] = [];
  for (const item of items) {
    const derived = newBounceMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankBounceMilestone(item: BounceMilestone): string {
  return globalComplaintDraftBucket(item.adjustedValue());
}
