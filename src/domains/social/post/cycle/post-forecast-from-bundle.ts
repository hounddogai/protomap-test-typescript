import { pendingApprovalBundleBucket } from "../../approval/agreement/pending-approval-bundle-policy.js";
import { PendingApprovalBundle } from "../../approval/agreement/pending-approval-bundle.js";
import { PostForecast, newPostForecast } from "./post-forecast.js";

export function summarizePendingApprovalBundlesForForecast(items: PendingApprovalBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePostForecastsFromBundle(items: PendingApprovalBundle[]): PostForecast[] {
  const out: PostForecast[] = [];
  for (const item of items) {
    const derived = newPostForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePostForecast(item: PostForecast): string {
  return pendingApprovalBundleBucket(item.measuredValue());
}
