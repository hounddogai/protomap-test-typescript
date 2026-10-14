import * as text from "../../../../kit/text.js";
import { ManualSlaReview } from "./manual-sla-review.js";

/** How screens and exports show a manual sla review. */
export class ManualSlaReviewView {
  codeText: string;
  title: string;
  updatedAtText: string;
  sendAt: string;
  durationMinutes: string;
  timezone: string;
  source: string;
  floorValue: string;
  conversionRateText: string;
  contactEmail: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    updatedAtText: string,
    sendAt: string,
    durationMinutes: string,
    timezone: string,
    source: string,
    floorValue: string,
    conversionRateText: string,
    contactEmail: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.updatedAtText = updatedAtText;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
    this.source = source;
    this.floorValue = floorValue;
    this.conversionRateText = conversionRateText;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toManualSlaReviewView(item: ManualSlaReview): ManualSlaReviewView {
  return new ManualSlaReviewView(
    item.code,
    item.title,
    String(item.updatedAt),
    String(item.sendAt),
    String(item.durationMinutes),
    item.timezone,
    text.truncate(item.source, 120),
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.contactEmail, 40),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualSlaReviewViews(items: ManualSlaReview[]): ManualSlaReviewView[] {
  const views: ManualSlaReviewView[] = [];
  for (const item of items) {
    views.push(toManualSlaReviewView(item));
  }
  return views;
}

export function sumManualSlaReviewView(view: ManualSlaReviewView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedUpdatedAt + parsedSendAt + parsedDurationMinutes;
}
