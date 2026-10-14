import {
  normalizeBatchedConversionReservationCode,
} from "../../conversion/manifest/batched-conversion-reservation-policy.js";
import { PrimaryConversionAudit } from "../../conversion/manifest/primary-conversion-audit.js";
import { PathQuota, newPathQuota } from "./path-quota.js";

export function summarizePrimaryConversionAuditsForQuota(items: PrimaryConversionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePathQuotasFromAudit(items: PrimaryConversionAudit[]): PathQuota[] {
  const out: PathQuota[] = [];
  for (const item of items) {
    const derived = newPathQuota(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPathQuotaExtra(item: PathQuota): string {
  return normalizeBatchedConversionReservationCode(item.code);
}
