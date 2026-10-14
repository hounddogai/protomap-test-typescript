import { GlobalLevelAssignment } from "../../level/policy/global-level-assignment.js";
import { normalizeLegacyLevelNoticeCode } from "../../level/policy/legacy-level-notice-policy.js";
import { BadgeDraft, newBadgeDraft } from "./badge-draft.js";

export function summarizeGlobalLevelAssignmentsForDraft(items: GlobalLevelAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBadgeDraftsFromAssignment(items: GlobalLevelAssignment[]): BadgeDraft[] {
  const out: BadgeDraft[] = [];
  for (const item of items) {
    const derived = newBadgeDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBadgeDraft(item: BadgeDraft): string {
  return normalizeLegacyLevelNoticeCode(item.code);
}
