import { classifyInviteClaim } from "../entry/invite-claim-policy.js";
import { InvitePreference } from "../entry/invite-preference.js";
import { TieredInviteSchedule, newTieredInviteSchedule } from "./tiered-invite-schedule.js";

export function summarizeInvitePreferencesForSchedule(items: InvitePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTieredInviteSchedulesFromPreference(items: InvitePreference[]): TieredInviteSchedule[] {
  const out: TieredInviteSchedule[] = [];
  for (const item of items) {
    const derived = newTieredInviteSchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitTieredInviteSchedule(item: TieredInviteSchedule): string {
  return classifyInviteClaim(item.measuredValue());
}
