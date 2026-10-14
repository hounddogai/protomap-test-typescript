import * as text from "../../../../kit/text.js";
import { RegionalConversionSchedule } from "./regional-conversion-schedule.js";

/** How screens and exports show a regional conversion schedule. */
export class RegionalConversionScheduleView {
  code: string;
  nameText: string;
  bid: string;
  retries: string;
  title: string;
  approved: string;
  locale: string;
  country: string;
  variant: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    bid: string,
    retries: string,
    title: string,
    approved: string,
    locale: string,
    country: string,
    variant: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.bid = bid;
    this.retries = retries;
    this.title = title;
    this.approved = approved;
    this.locale = locale;
    this.country = country;
    this.variant = variant;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalConversionScheduleView(item: RegionalConversionSchedule): RegionalConversionScheduleView {
  return new RegionalConversionScheduleView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    String(item.retries),
    text.truncate(item.title, 120),
    `${item.approved}`,
    text.truncate(item.locale, 40),
    text.truncate(item.country, 80),
    text.truncate(item.variant, 64),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalConversionScheduleViews(items: RegionalConversionSchedule[]): RegionalConversionScheduleView[] {
  const views: RegionalConversionScheduleView[] = [];
  for (const item of items) {
    views.push(toRegionalConversionScheduleView(item));
  }
  return views;
}

export function sumRegionalConversionScheduleView(view: RegionalConversionScheduleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBid + parsedRetries;
}
