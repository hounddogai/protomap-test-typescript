import { normalizeRedemptionBaselineCode } from "../../redemption/allocation/redemption-baseline-policy.js";
import { RedemptionBaseline } from "../../redemption/allocation/redemption-baseline.js";
import { GlobalBadgeTemplate, newGlobalBadgeTemplate } from "./global-badge-template.js";

export function summarizeRedemptionBaselinesForTemplate(items: RedemptionBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalBadgeTemplatesFromBaseline(items: RedemptionBaseline[]): GlobalBadgeTemplate[] {
  const out: GlobalBadgeTemplate[] = [];
  for (const item of items) {
    const derived = newGlobalBadgeTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeGlobalBadgeTemplate(item: GlobalBadgeTemplate): string {
  return normalizeRedemptionBaselineCode(item.code);
}
