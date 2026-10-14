import * as text from "../../../../kit/text.js";
import { StrictCsatQuota } from "./strict-csat-quota.js";

/** How screens and exports show a strict csat quota. */
export class StrictCsatQuotaView {
  code: string;
  nameText: string;
  maximum: string;
  graceDays: string;
  variant: string;
  channel: string;
  utmSource: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    maximum: string,
    graceDays: string,
    variant: string,
    channel: string,
    utmSource: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.variant = variant;
    this.channel = channel;
    this.utmSource = utmSource;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCsatQuotaView(item: StrictCsatQuota): StrictCsatQuotaView {
  return new StrictCsatQuotaView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    String(item.graceDays),
    text.truncate(item.variant, 64),
    item.channel,
    item.utmSource,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCsatQuotaViews(items: StrictCsatQuota[]): StrictCsatQuotaView[] {
  const views: StrictCsatQuotaView[] = [];
  for (const item of items) {
    views.push(toStrictCsatQuotaView(item));
  }
  return views;
}

export function sumStrictCsatQuotaView(view: StrictCsatQuotaView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedMaximum + parsedGraceDays + parsedWeight;
}
