import { normalizeComplaintEstimateCode } from "../../complaint/override-item/complaint-estimate-policy.js";
import { ComplaintOverride } from "../../complaint/override-item/complaint-override.js";
import { WarmupBudget, newWarmupBudget } from "./warmup-budget.js";

export function summarizeComplaintOverridesForBudget(items: ComplaintOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveWarmupBudgetsFromOverride(items: ComplaintOverride[]): WarmupBudget[] {
  const out: WarmupBudget[] = [];
  for (const item of items) {
    const derived = newWarmupBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchWarmupBudget(item: WarmupBudget): string {
  return normalizeComplaintEstimateCode(item.code);
}
