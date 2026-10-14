import { WarmupEstimate } from "../../warmup/estimate/warmup-estimate.js";
import { normalizeWarmupExceptionCode } from "../../warmup/estimate/warmup-exception-policy.js";
import { BounceRecord, newBounceRecord } from "./bounce-record.js";

export function summarizeWarmupEstimatesForRecord(items: WarmupEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBounceRecordsFromEstimate(items: WarmupEstimate[]): BounceRecord[] {
  const out: BounceRecord[] = [];
  for (const item of items) {
    const derived = newBounceRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectBounceRecord(item: BounceRecord): string {
  return normalizeWarmupExceptionCode(item.code);
}
