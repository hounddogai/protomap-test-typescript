import { normalizeSenderRequestCode } from "../../sender/sender-proposal/sender-request-policy.js";
import { SenderRequest } from "../../sender/sender-proposal/sender-request.js";
import { WarmupTier, newWarmupTier } from "./warmup-tier.js";

export function summarizeSenderRequestsForTier(items: SenderRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveWarmupTiersFromRequest(items: SenderRequest[]): WarmupTier[] {
  const out: WarmupTier[] = [];
  for (const item of items) {
    const derived = newWarmupTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWarmupTier(item: WarmupTier): string {
  return normalizeSenderRequestCode(item.code);
}
