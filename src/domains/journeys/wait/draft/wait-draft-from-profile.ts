import { TieredEnrollmentProfile } from "../../enrollment/snapshot/tiered-enrollment-profile.js";
import {
  normalizeTieredEnrollmentSnapshotCode,
} from "../../enrollment/snapshot/tiered-enrollment-snapshot-policy.js";
import { WaitDraft, newWaitDraft } from "./wait-draft.js";

export function summarizeTieredEnrollmentProfilesForDraft(items: TieredEnrollmentProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWaitDraftsFromProfile(items: TieredEnrollmentProfile[]): WaitDraft[] {
  const out: WaitDraft[] = [];
  for (const item of items) {
    const derived = newWaitDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planWaitDraft(item: WaitDraft): string {
  return normalizeTieredEnrollmentSnapshotCode(item.code);
}
