import * as text from "../../../../kit/text.js";
import { CappedSenderQuota } from "./capped-sender-quota.js";

/** How screens and exports show a capped sender quota. */
export class CappedSenderQuotaView {
  code: string;
  title: string;
  amountText: string;
  region: string;
  minimum: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amountText: string,
    region: string,
    minimum: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amountText = amountText;
    this.region = region;
    this.minimum = minimum;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSenderQuotaView(item: CappedSenderQuota): CappedSenderQuotaView {
  return new CappedSenderQuotaView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 80),
    item.amount.toFixed(2),
    item.region,
    item.minimum.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSenderQuotaViews(items: CappedSenderQuota[]): CappedSenderQuotaView[] {
  const views: CappedSenderQuotaView[] = [];
  for (const item of items) {
    views.push(toCappedSenderQuotaView(item));
  }
  return views;
}

export function sumCappedSenderQuotaView(view: CappedSenderQuotaView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedAmount + parsedMinimum + parsedMargin;
}
