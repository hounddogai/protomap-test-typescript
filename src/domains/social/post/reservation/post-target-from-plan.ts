import { classifyLegacyInsightSegment } from "../../insight/segment/legacy-insight-segment-policy.js";
import { ScheduledInsightPlan } from "../../insight/segment/scheduled-insight-plan.js";
import { PostTarget, newPostTarget } from "./post-target.js";

export function summarizeScheduledInsightPlansForTarget(items: ScheduledInsightPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePostTargetsFromPlan(items: ScheduledInsightPlan[]): PostTarget[] {
  const out: PostTarget[] = [];
  for (const item of items) {
    const derived = newPostTarget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPostTarget(item: PostTarget): string {
  return classifyLegacyInsightSegment(item.adjustedTotal());
}
