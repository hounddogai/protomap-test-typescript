import { normalizeSenderDigestCode } from "../../sender/sender-proposal/sender-digest-policy.js";
import { SenderRequest } from "../../sender/sender-proposal/sender-request.js";
import { DomainThreshold, newDomainThreshold } from "./domain-threshold.js";

export function summarizeSenderRequestsForThreshold(items: SenderRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveDomainThresholdsFromRequest(items: SenderRequest[]): DomainThreshold[] {
  const out: DomainThreshold[] = [];
  for (const item of items) {
    const derived = newDomainThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectDomainThreshold(item: DomainThreshold): string {
  return normalizeSenderDigestCode(item.code);
}
