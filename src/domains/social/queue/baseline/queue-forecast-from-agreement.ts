import { ApprovalAgreement } from "../../approval/agreement/approval-agreement.js";
import { pendingApprovalBundleBucket } from "../../approval/agreement/pending-approval-bundle-policy.js";
import { QueueForecast, newQueueForecast } from "./queue-forecast.js";

export function summarizeApprovalAgreementsForForecast(items: ApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveQueueForecastsFromAgreement(items: ApprovalAgreement[]): QueueForecast[] {
  const out: QueueForecast[] = [];
  for (const item of items) {
    const derived = newQueueForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceQueueForecast(item: QueueForecast): string {
  return pendingApprovalBundleBucket(item.weightedVolume());
}
