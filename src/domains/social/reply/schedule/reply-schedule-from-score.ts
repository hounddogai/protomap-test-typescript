import { classifyDefaultPostScore } from "../../post/rollup/default-post-score-policy.js";
import { DefaultPostScore } from "../../post/rollup/default-post-score.js";
import { ReplySchedule, newReplySchedule } from "./reply-schedule.js";

export function summarizeDefaultPostScoresForSchedule(items: DefaultPostScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveReplySchedulesFromScore(items: DefaultPostScore[]): ReplySchedule[] {
  const out: ReplySchedule[] = [];
  for (const item of items) {
    const derived = newReplySchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleReplySchedule(item: ReplySchedule): string {
  return classifyDefaultPostScore(item.netValue());
}
