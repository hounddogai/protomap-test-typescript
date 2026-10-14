import * as text from "../../../../kit/text.js";
import { ComplaintDigest } from "./complaint-digest.js";

/** How screens and exports show a complaint digest. */
export class ComplaintDigestView {
  code: string;
  title: string;
  segment: string;
  graceDays: string;
  rateText: string;
  journeyIdText: string;
  capacity: string;
  timezone: string;
  active: string;
  unit: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segment: string,
    graceDays: string,
    rateText: string,
    journeyIdText: string,
    capacity: string,
    timezone: string,
    active: string,
    unit: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.graceDays = graceDays;
    this.rateText = rateText;
    this.journeyIdText = journeyIdText;
    this.capacity = capacity;
    this.timezone = timezone;
    this.active = active;
    this.unit = unit;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintDigestView(item: ComplaintDigest): ComplaintDigestView {
  return new ComplaintDigestView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.segment, 40),
    String(item.graceDays),
    item.rate.toFixed(2),
    item.journeyId,
    String(item.capacity),
    text.truncate(item.timezone, 80),
    `${item.active}`,
    item.unit,
    text.truncate(item.contactEmail, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintDigestViews(items: ComplaintDigest[]): ComplaintDigestView[] {
  const views: ComplaintDigestView[] = [];
  for (const item of items) {
    views.push(toComplaintDigestView(item));
  }
  return views;
}

export function sumComplaintDigestView(view: ComplaintDigestView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedGraceDays + parsedRate + parsedCapacity;
}
