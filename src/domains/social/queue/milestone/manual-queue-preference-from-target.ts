import { normalizeReplyTargetCode } from "../../reply/plan/reply-target-policy.js";
import { ReplyTarget } from "../../reply/plan/reply-target.js";
import { ManualQueuePreference, newManualQueuePreference } from "./manual-queue-preference.js";

export function summarizeReplyTargetsForPreference(items: ReplyTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveManualQueuePreferencesFromTarget(items: ReplyTarget[]): ManualQueuePreference[] {
  const out: ManualQueuePreference[] = [];
  for (const item of items) {
    const derived = newManualQueuePreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualQueuePreference(item: ManualQueuePreference): string {
  return normalizeReplyTargetCode(item.code);
}
