import { BranchAssignment } from "../../branch/branch-manifest/branch-assignment.js";
import { normalizeGlobalBranchReviewCode } from "../../branch/branch-manifest/global-branch-review-policy.js";
import { WaitForecast, newWaitForecast } from "./wait-forecast.js";

export function summarizeBranchAssignmentsForForecast(items: BranchAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWaitForecastsFromAssignment(items: BranchAssignment[]): WaitForecast[] {
  const out: WaitForecast[] = [];
  for (const item of items) {
    const derived = newWaitForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWaitForecast(item: WaitForecast): string {
  return normalizeGlobalBranchReviewCode(item.code);
}
