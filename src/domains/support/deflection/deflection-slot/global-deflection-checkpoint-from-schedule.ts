import {
  normalizePrimaryTicketViewScheduleCode,
} from "../../ticket-view/view-claim/primary-ticket-view-schedule-policy.js";
import { PrimaryTicketViewSchedule } from "../../ticket-view/view-claim/primary-ticket-view-schedule.js";
import { GlobalDeflectionCheckpoint, newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

export function summarizePrimaryTicketViewSchedulesForCheckpoint(items: PrimaryTicketViewSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveGlobalDeflectionCheckpointsFromSchedule(items: PrimaryTicketViewSchedule[]): GlobalDeflectionCheckpoint[] {
  const out: GlobalDeflectionCheckpoint[] = [];
  for (const item of items) {
    const derived = newGlobalDeflectionCheckpoint(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyGlobalDeflectionCheckpoint(item: GlobalDeflectionCheckpoint): string {
  return normalizePrimaryTicketViewScheduleCode(item.code);
}
