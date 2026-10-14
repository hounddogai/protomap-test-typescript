import * as text from "../../../../kit/text.js";
import { DeflectionQuota } from "./deflection-quota.js";

/** How screens and exports show a deflection quota. */
export class DeflectionQuotaView {
  code: string;
  title: string;
  openRateText: string;
  sourceText: string;
  amount: string;
  externalRef: string;
  active: string;
  ratio: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRateText: string,
    sourceText: string,
    amount: string,
    externalRef: string,
    active: string,
    ratio: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRateText = openRateText;
    this.sourceText = sourceText;
    this.amount = amount;
    this.externalRef = externalRef;
    this.active = active;
    this.ratio = ratio;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionQuotaView(item: DeflectionQuota): DeflectionQuotaView {
  return new DeflectionQuotaView(
    item.code,
    item.title,
    item.openRate.toFixed(2),
    item.source,
    item.amount.toFixed(2),
    item.externalRef,
    `${item.active}`,
    item.ratio.toFixed(2),
    text.truncate(item.timezone, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionQuotaViews(items: DeflectionQuota[]): DeflectionQuotaView[] {
  const views: DeflectionQuotaView[] = [];
  for (const item of items) {
    views.push(toDeflectionQuotaView(item));
  }
  return views;
}

export function sumDeflectionQuotaView(view: DeflectionQuotaView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedOpenRate + parsedAmount + parsedRatio;
}
