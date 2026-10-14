import * as text from "../../../../kit/text.js";
import { FallbackCreativeSchedule } from "./fallback-creative-schedule.js";

/** How screens and exports show a fallback creative schedule. */
export class FallbackCreativeScheduleView {
  code: string;
  label: string;
  rate: string;
  conversionRate: string;
  countryText: string;
  title: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rate: string,
    conversionRate: string,
    countryText: string,
    title: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.countryText = countryText;
    this.title = title;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreativeScheduleView(item: FallbackCreativeSchedule): FallbackCreativeScheduleView {
  return new FallbackCreativeScheduleView(
    item.code,
    text.truncate(item.label, 80),
    item.rate.toFixed(2),
    item.conversionRate.toFixed(2),
    item.country,
    text.truncate(item.title, 80),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreativeScheduleViews(items: FallbackCreativeSchedule[]): FallbackCreativeScheduleView[] {
  const views: FallbackCreativeScheduleView[] = [];
  for (const item of items) {
    views.push(toFallbackCreativeScheduleView(item));
  }
  return views;
}

export function sumFallbackCreativeScheduleView(view: FallbackCreativeScheduleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRate + parsedConversionRate + parsedCapacity;
}
