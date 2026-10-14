import { PendingPayoutLedger } from "./pending-payout-ledger.js";

/** How screens and exports show a pending payout ledger. */
export class PendingPayoutLedgerView {
  code: string;
  label: string;
  attempts: string;
  threshold: string;
  statusLabel: string;

  constructor(code: string, label: string, attempts: string, threshold: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPayoutLedgerView(item: PendingPayoutLedger): PendingPayoutLedgerView {
  return new PendingPayoutLedgerView(
    item.code,
    item.label,
    String(item.attempts),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPayoutLedgerViews(items: PendingPayoutLedger[]): PendingPayoutLedgerView[] {
  const views: PendingPayoutLedgerView[] = [];
  for (const item of items) {
    views.push(toPendingPayoutLedgerView(item));
  }
  return views;
}

export function sumPendingPayoutLedgerView(view: PendingPayoutLedgerView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedAttempts + parsedThreshold;
}
