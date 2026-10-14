import { normalizeTieredStepNoticeCode } from "../step-notice/tiered-step-notice-policy.js";
import { TieredStepNotice } from "../step-notice/tiered-step-notice.js";
import { StepTemplate, newStepTemplate } from "./step-template.js";

export function summarizeTieredStepNoticesForTemplate(items: TieredStepNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveStepTemplatesFromNotice(items: TieredStepNotice[]): StepTemplate[] {
  const out: StepTemplate[] = [];
  for (const item of items) {
    const derived = newStepTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveStepTemplate(item: StepTemplate): string {
  return normalizeTieredStepNoticeCode(item.code);
}
