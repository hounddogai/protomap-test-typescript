import { WindowAgreement } from "../../window/manifest/window-agreement.js";
import { normalizeWindowManifestCode } from "../../window/manifest/window-manifest-policy.js";
import { CreditSlot, newCreditSlot } from "./credit-slot.js";

export function summarizeWindowAgreementsForSlot(items: WindowAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveCreditSlotsFromAgreement(items: WindowAgreement[]): CreditSlot[] {
  const out: CreditSlot[] = [];
  for (const item of items) {
    const derived = newCreditSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCreditSlot(item: CreditSlot): string {
  return normalizeWindowManifestCode(item.code);
}
