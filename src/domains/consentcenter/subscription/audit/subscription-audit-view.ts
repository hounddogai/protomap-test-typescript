import * as text from "../../../../kit/text.js";
import { SubscriptionAudit } from "./subscription-audit.js";

/** How screens and exports show a subscription audit. */
export class SubscriptionAuditView {
  code: string;
  label: string;
  channel: string;
  utmSource: string;
  costText: string;
  windowDays: string;
  journeyIdText: string;
  currencyText: string;
  unit: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    utmSource: string,
    costText: string,
    windowDays: string,
    journeyIdText: string,
    currencyText: string,
    unit: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.utmSource = utmSource;
    this.costText = costText;
    this.windowDays = windowDays;
    this.journeyIdText = journeyIdText;
    this.currencyText = currencyText;
    this.unit = unit;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionAuditView(item: SubscriptionAudit): SubscriptionAuditView {
  return new SubscriptionAuditView(
    item.code,
    item.label,
    item.channel,
    item.utmSource,
    item.cost.toFixed(2),
    String(item.windowDays),
    item.journeyId,
    item.currency,
    text.truncate(item.unit, 64),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionAuditViews(items: SubscriptionAudit[]): SubscriptionAuditView[] {
  const views: SubscriptionAuditView[] = [];
  for (const item of items) {
    views.push(toSubscriptionAuditView(item));
  }
  return views;
}

export function sumSubscriptionAuditView(view: SubscriptionAuditView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedCost + parsedWindowDays + parsedExpiresAt;
}
