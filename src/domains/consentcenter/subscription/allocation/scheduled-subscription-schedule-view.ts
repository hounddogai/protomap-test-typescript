import * as text from "../../../../kit/text.js";
import { ScheduledSubscriptionSchedule } from "./scheduled-subscription-schedule.js";

/** How screens and exports show a scheduled subscription schedule. */
export class ScheduledSubscriptionScheduleView {
  code: string;
  title: string;
  quantityText: string;
  region: string;
  contactEmail: string;
  active: string;
  rateText: string;
  capacity: string;
  cohortText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantityText: string,
    region: string,
    contactEmail: string,
    active: string,
    rateText: string,
    capacity: string,
    cohortText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantityText = quantityText;
    this.region = region;
    this.contactEmail = contactEmail;
    this.active = active;
    this.rateText = rateText;
    this.capacity = capacity;
    this.cohortText = cohortText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSubscriptionScheduleView(item: ScheduledSubscriptionSchedule): ScheduledSubscriptionScheduleView {
  return new ScheduledSubscriptionScheduleView(
    text.truncate(item.code, 64),
    item.title,
    String(item.quantity),
    item.region,
    item.contactEmail,
    `${item.active}`,
    item.rate.toFixed(2),
    String(item.capacity),
    item.cohort,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSubscriptionScheduleViews(items: ScheduledSubscriptionSchedule[]): ScheduledSubscriptionScheduleView[] {
  const views: ScheduledSubscriptionScheduleView[] = [];
  for (const item of items) {
    views.push(toScheduledSubscriptionScheduleView(item));
  }
  return views;
}

export function sumScheduledSubscriptionScheduleView(view: ScheduledSubscriptionScheduleView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedQuantity + parsedRate + parsedCapacity;
}
