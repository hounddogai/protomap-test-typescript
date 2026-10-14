import {
  normalizeStrictReputationExceptionCode,
} from "../../reputation/seasonal-reputation-exception/strict-reputation-exception-policy.js";
import {
  StrictReputationException,
} from "../../reputation/seasonal-reputation-exception/strict-reputation-exception.js";
import { SenderSchedule, newSenderSchedule } from "./sender-schedule.js";

export function summarizeStrictReputationExceptionsForSchedule(items: StrictReputationException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSenderSchedulesFromException(items: StrictReputationException[]): SenderSchedule[] {
  const out: SenderSchedule[] = [];
  for (const item of items) {
    const derived = newSenderSchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveSenderSchedule(item: SenderSchedule): string {
  return normalizeStrictReputationExceptionCode(item.code);
}
