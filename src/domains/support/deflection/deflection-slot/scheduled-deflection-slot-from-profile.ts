import { csatProfileWeight } from "../../csat/audit/csat-profile-policy.js";
import { CsatProfile } from "../../csat/audit/csat-profile.js";
import { ScheduledDeflectionSlot, newScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

export function summarizeCsatProfilesForSlot(items: CsatProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveScheduledDeflectionSlotsFromProfile(items: CsatProfile[]): ScheduledDeflectionSlot[] {
  const out: ScheduledDeflectionSlot[] = [];
  for (const item of items) {
    const derived = newScheduledDeflectionSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveScheduledDeflectionSlot(item: ScheduledDeflectionSlot): number {
  return csatProfileWeight(8, true);
}
