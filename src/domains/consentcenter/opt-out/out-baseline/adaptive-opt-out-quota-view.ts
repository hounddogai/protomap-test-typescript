import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutQuota } from "./adaptive-opt-out-quota.js";

/** How screens and exports show a adaptive opt out quota. */
export class AdaptiveOptOutQuotaView {
  code: string;
  label: string;
  utmSource: string;
  summaryText: string;
  phone: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    summaryText: string,
    phone: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.summaryText = summaryText;
    this.phone = phone;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveOptOutQuotaView(item: AdaptiveOptOutQuota): AdaptiveOptOutQuotaView {
  return new AdaptiveOptOutQuotaView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.utmSource, 40),
    text.truncate(item.summary, 40),
    item.phone,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveOptOutQuotaViews(items: AdaptiveOptOutQuota[]): AdaptiveOptOutQuotaView[] {
  const views: AdaptiveOptOutQuotaView[] = [];
  for (const item of items) {
    views.push(toAdaptiveOptOutQuotaView(item));
  }
  return views;
}

export function sumAdaptiveOptOutQuotaView(view: AdaptiveOptOutQuotaView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
