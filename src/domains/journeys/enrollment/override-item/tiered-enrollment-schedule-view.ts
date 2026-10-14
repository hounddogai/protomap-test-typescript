import * as text from "../../../../kit/text.js";
import { TieredEnrollmentSchedule } from "./tiered-enrollment-schedule.js";

/** How screens and exports show a tiered enrollment schedule. */
export class TieredEnrollmentScheduleView {
  code: string;
  titleText: string;
  ownerId: string;
  updatedAt: string;
  quantity: string;
  approved: string;
  retries: string;
  sendAt: string;
  createdAtText: string;
  conversionRateText: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ownerId: string,
    updatedAt: string,
    quantity: string,
    approved: string,
    retries: string,
    sendAt: string,
    createdAtText: string,
    conversionRateText: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ownerId = ownerId;
    this.updatedAt = updatedAt;
    this.quantity = quantity;
    this.approved = approved;
    this.retries = retries;
    this.sendAt = sendAt;
    this.createdAtText = createdAtText;
    this.conversionRateText = conversionRateText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toTieredEnrollmentScheduleView(item: TieredEnrollmentSchedule): TieredEnrollmentScheduleView {
  return new TieredEnrollmentScheduleView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    item.ownerId,
    String(item.updatedAt),
    String(item.quantity),
    `${item.approved}`,
    String(item.retries),
    String(item.sendAt),
    String(item.createdAt),
    item.conversionRate.toFixed(2),
    text.truncate(item.region, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredEnrollmentScheduleViews(items: TieredEnrollmentSchedule[]): TieredEnrollmentScheduleView[] {
  const views: TieredEnrollmentScheduleView[] = [];
  for (const item of items) {
    views.push(toTieredEnrollmentScheduleView(item));
  }
  return views;
}

export function sumTieredEnrollmentScheduleView(view: TieredEnrollmentScheduleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedUpdatedAt + parsedQuantity + parsedRetries;
}
