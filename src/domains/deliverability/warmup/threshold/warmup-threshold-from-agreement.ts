import { normalizeDomainAgreementCode } from "../../domain/manifest/domain-agreement-policy.js";
import { DomainAgreement } from "../../domain/manifest/domain-agreement.js";
import { WarmupThreshold, newWarmupThreshold } from "./warmup-threshold.js";

export function summarizeDomainAgreementsForThreshold(items: DomainAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWarmupThresholdsFromAgreement(items: DomainAgreement[]): WarmupThreshold[] {
  const out: WarmupThreshold[] = [];
  for (const item of items) {
    const derived = newWarmupThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectWarmupThreshold(item: WarmupThreshold): string {
  return normalizeDomainAgreementCode(item.code);
}
