import { PendingPaywallAudit } from "./pending-paywall-audit.js";

/** How screens and exports show a pending paywall audit. */
export class PendingPaywallAuditView {
  code: string;
  label: string;
  sendAtText: string;
  sourceText: string;
  graceDays: string;
  windowDays: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAtText: string,
    sourceText: string,
    graceDays: string,
    windowDays: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAtText = sendAtText;
    this.sourceText = sourceText;
    this.graceDays = graceDays;
    this.windowDays = windowDays;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPaywallAuditView(item: PendingPaywallAudit): PendingPaywallAuditView {
  return new PendingPaywallAuditView(
    item.code,
    item.label,
    String(item.sendAt),
    item.source,
    String(item.graceDays),
    String(item.windowDays),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPaywallAuditViews(items: PendingPaywallAudit[]): PendingPaywallAuditView[] {
  const views: PendingPaywallAuditView[] = [];
  for (const item of items) {
    views.push(toPendingPaywallAuditView(item));
  }
  return views;
}

export function sumPendingPaywallAuditView(view: PendingPaywallAuditView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedSendAt + parsedGraceDays + parsedWindowDays;
}
