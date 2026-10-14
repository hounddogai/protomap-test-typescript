import { manualBadgeQuotaBucket } from "../audit/manual-badge-quota-policy.js";
import { PendingBadgeAudit } from "../audit/pending-badge-audit.js";
import { PrimaryBadgeWindow, newPrimaryBadgeWindow } from "./primary-badge-window.js";

export function summarizePendingBadgeAuditsForWindow(items: PendingBadgeAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePrimaryBadgeWindowsFromAudit(items: PendingBadgeAudit[]): PrimaryBadgeWindow[] {
  const out: PrimaryBadgeWindow[] = [];
  for (const item of items) {
    const derived = newPrimaryBadgeWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPrimaryBadgeWindow(item: PrimaryBadgeWindow): string {
  return manualBadgeQuotaBucket(item.adjustedLoad());
}
