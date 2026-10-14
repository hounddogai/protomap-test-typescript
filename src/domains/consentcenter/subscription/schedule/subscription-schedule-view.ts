import * as text from "../../../../kit/text.js";
import { SubscriptionSchedule } from "./subscription-schedule.js";

/** How screens and exports show a subscription schedule. */
export class SubscriptionScheduleView {
  code: string;
  title: string;
  name: string;
  timezone: string;
  notesText: string;
  descriptionText: string;
  sourceText: string;
  variantText: string;
  currency: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    timezone: string,
    notesText: string,
    descriptionText: string,
    sourceText: string,
    variantText: string,
    currency: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.timezone = timezone;
    this.notesText = notesText;
    this.descriptionText = descriptionText;
    this.sourceText = sourceText;
    this.variantText = variantText;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionScheduleView(item: SubscriptionSchedule): SubscriptionScheduleView {
  return new SubscriptionScheduleView(
    item.code,
    item.title,
    item.name,
    item.timezone,
    text.truncate(item.notes, 64),
    item.description,
    text.truncate(item.source, 40),
    text.truncate(item.variant, 64),
    item.currency,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionScheduleViews(items: SubscriptionSchedule[]): SubscriptionScheduleView[] {
  const views: SubscriptionScheduleView[] = [];
  for (const item of items) {
    views.push(toSubscriptionScheduleView(item));
  }
  return views;
}

export function sumSubscriptionScheduleView(view: SubscriptionScheduleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
