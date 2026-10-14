import { classifyLenientWindowProfile } from "../../window/target/lenient-window-profile-policy.js";
import { RegionalWindowAudit } from "../../window/target/regional-window-audit.js";
import { StrictCreditRecord, newStrictCreditRecord } from "./strict-credit-record.js";

export function summarizeRegionalWindowAuditsForRecord(items: RegionalWindowAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveStrictCreditRecordsFromAudit(items: RegionalWindowAudit[]): StrictCreditRecord[] {
  const out: StrictCreditRecord[] = [];
  for (const item of items) {
    const derived = newStrictCreditRecord(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeStrictCreditRecord(item: StrictCreditRecord): string {
  return classifyLenientWindowProfile(item.adjustedTotal());
}
