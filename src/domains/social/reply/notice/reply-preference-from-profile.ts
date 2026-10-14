import { BatchedPostProfile } from "../../post/notice/batched-post-profile.js";
import { postNoticeWeight } from "../../post/notice/post-notice-policy.js";
import { ReplyPreference, newReplyPreference } from "./reply-preference.js";

export function summarizeBatchedPostProfilesForPreference(items: BatchedPostProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveReplyPreferencesFromProfile(items: BatchedPostProfile[]): ReplyPreference[] {
  const out: ReplyPreference[] = [];
  for (const item of items) {
    const derived = newReplyPreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectReplyPreference(item: ReplyPreference): number {
  return postNoticeWeight(9, true);
}
