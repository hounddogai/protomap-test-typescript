import * as text from "../../../../kit/text.js";
import { ScheduledDomainRecord } from "./scheduled-domain-record.js";

/** How screens and exports show a scheduled domain record. */
export class ScheduledDomainRecordView {
  code: string;
  titleText: string;
  regionText: string;
  discount: string;
  locale: string;
  phone: string;
  openRate: string;
  startsAt: string;
  source: string;
  threshold: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    regionText: string,
    discount: string,
    locale: string,
    phone: string,
    openRate: string,
    startsAt: string,
    source: string,
    threshold: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.regionText = regionText;
    this.discount = discount;
    this.locale = locale;
    this.phone = phone;
    this.openRate = openRate;
    this.startsAt = startsAt;
    this.source = source;
    this.threshold = threshold;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDomainRecordView(item: ScheduledDomainRecord): ScheduledDomainRecordView {
  return new ScheduledDomainRecordView(
    text.truncate(item.code, 64),
    item.title,
    item.region,
    item.discount.toFixed(2),
    item.locale,
    item.phone,
    item.openRate.toFixed(2),
    String(item.startsAt),
    item.source,
    item.threshold.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDomainRecordViews(items: ScheduledDomainRecord[]): ScheduledDomainRecordView[] {
  const views: ScheduledDomainRecordView[] = [];
  for (const item of items) {
    views.push(toScheduledDomainRecordView(item));
  }
  return views;
}

export function sumScheduledDomainRecordView(view: ScheduledDomainRecordView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedDiscount + parsedOpenRate + parsedStartsAt;
}
