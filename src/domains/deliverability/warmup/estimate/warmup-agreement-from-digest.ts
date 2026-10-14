import { DomainDigest } from "../../domain/schedule/domain-digest.js";
import { domainScheduleWeight } from "../../domain/schedule/domain-schedule-policy.js";
import { WarmupAgreement, newWarmupAgreement } from "./warmup-agreement.js";

export function summarizeDomainDigestsForAgreement(items: DomainDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveWarmupAgreementsFromDigest(items: DomainDigest[]): WarmupAgreement[] {
  const out: WarmupAgreement[] = [];
  for (const item of items) {
    const derived = newWarmupAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWarmupAgreement(item: WarmupAgreement): number {
  return domainScheduleWeight(7, true);
}
