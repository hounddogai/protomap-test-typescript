import * as text from "../../../../kit/text.js";
import { RedemptionSchedule } from "./redemption-schedule.js";

/** How screens and exports show a redemption schedule. */
export class RedemptionScheduleView {
  code: string;
  nameText: string;
  contactEmail: string;
  threshold: string;
  category: string;
  archived: string;
  createdAt: string;
  currencyText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    contactEmail: string,
    threshold: string,
    category: string,
    archived: string,
    createdAt: string,
    currencyText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.category = category;
    this.archived = archived;
    this.createdAt = createdAt;
    this.currencyText = currencyText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionScheduleView(item: RedemptionSchedule): RedemptionScheduleView {
  return new RedemptionScheduleView(
    item.code,
    item.name,
    item.contactEmail,
    item.threshold.toFixed(2),
    item.category,
    `${item.archived}`,
    String(item.createdAt),
    text.truncate(item.currency, 64),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionScheduleViews(items: RedemptionSchedule[]): RedemptionScheduleView[] {
  const views: RedemptionScheduleView[] = [];
  for (const item of items) {
    views.push(toRedemptionScheduleView(item));
  }
  return views;
}

export function sumRedemptionScheduleView(view: RedemptionScheduleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedThreshold + parsedCreatedAt;
}
