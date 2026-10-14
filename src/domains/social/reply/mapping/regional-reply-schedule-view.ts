import * as text from "../../../../kit/text.js";
import { RegionalReplySchedule } from "./regional-reply-schedule.js";

/** How screens and exports show a regional reply schedule. */
export class RegionalReplyScheduleView {
  codeText: string;
  titleText: string;
  locale: string;
  startsAt: string;
  contactEmailText: string;
  quantityText: string;
  segmentText: string;
  approved: string;
  createdAt: string;
  ceilingText: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    locale: string,
    startsAt: string,
    contactEmailText: string,
    quantityText: string,
    segmentText: string,
    approved: string,
    createdAt: string,
    ceilingText: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.locale = locale;
    this.startsAt = startsAt;
    this.contactEmailText = contactEmailText;
    this.quantityText = quantityText;
    this.segmentText = segmentText;
    this.approved = approved;
    this.createdAt = createdAt;
    this.ceilingText = ceilingText;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalReplyScheduleView(item: RegionalReplySchedule): RegionalReplyScheduleView {
  return new RegionalReplyScheduleView(
    item.code,
    item.title,
    item.locale,
    String(item.startsAt),
    text.truncate(item.contactEmail, 80),
    String(item.quantity),
    text.truncate(item.segment, 80),
    `${item.approved}`,
    String(item.createdAt),
    item.ceiling.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalReplyScheduleViews(items: RegionalReplySchedule[]): RegionalReplyScheduleView[] {
  const views: RegionalReplyScheduleView[] = [];
  for (const item of items) {
    views.push(toRegionalReplyScheduleView(item));
  }
  return views;
}

export function sumRegionalReplyScheduleView(view: RegionalReplyScheduleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedStartsAt + parsedQuantity + parsedCreatedAt;
}
