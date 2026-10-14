import {
  normalizeLenientDeflectionRequestCode,
} from "../../deflection/deflection-segment/lenient-deflection-request-policy.js";
import { LenientDeflectionRequest } from "../../deflection/deflection-segment/lenient-deflection-request.js";
import { GlobalSlaDigest, newGlobalSlaDigest } from "./global-sla-digest.js";

export function summarizeLenientDeflectionRequestsForDigest(items: LenientDeflectionRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveGlobalSlaDigestsFromRequest(items: LenientDeflectionRequest[]): GlobalSlaDigest[] {
  const out: GlobalSlaDigest[] = [];
  for (const item of items) {
    const derived = newGlobalSlaDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateGlobalSlaDigest(item: GlobalSlaDigest): string {
  return normalizeLenientDeflectionRequestCode(item.code);
}
