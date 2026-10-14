import { classifyEnrollmentBundle } from "../../enrollment/milestone/enrollment-bundle-policy.js";
import { EnrollmentBundle } from "../../enrollment/milestone/enrollment-bundle.js";
import { RegionalBranchDraft, newRegionalBranchDraft } from "./regional-branch-draft.js";

export function summarizeEnrollmentBundlesForDraft(items: EnrollmentBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRegionalBranchDraftsFromBundle(items: EnrollmentBundle[]): RegionalBranchDraft[] {
  const out: RegionalBranchDraft[] = [];
  for (const item of items) {
    const derived = newRegionalBranchDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRegionalBranchDraft(item: RegionalBranchDraft): string {
  return classifyEnrollmentBundle(item.projectedLoad());
}
