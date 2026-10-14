import { FallbackWindowAudit } from "../../window/segment/fallback-window-audit.js";
import { normalizeWindowProposalCode } from "../../window/segment/window-proposal-policy.js";
import { TouchpointDigest, newTouchpointDigest } from "./touchpoint-digest.js";

export function summarizeFallbackWindowAuditsForDigest(items: FallbackWindowAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTouchpointDigestsFromAudit(items: FallbackWindowAudit[]): TouchpointDigest[] {
  const out: TouchpointDigest[] = [];
  for (const item of items) {
    const derived = newTouchpointDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTouchpointDigest(item: TouchpointDigest): string {
  return normalizeWindowProposalCode(item.code);
}
