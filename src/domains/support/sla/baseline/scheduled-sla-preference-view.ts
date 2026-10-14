import * as text from "../../../../kit/text.js";
import { ScheduledSlaPreference } from "./scheduled-sla-preference.js";

/** How screens and exports show a scheduled sla preference. */
export class ScheduledSlaPreferenceView {
  code: string;
  name: string;
  threshold: string;
  approved: string;
  utmSource: string;
  amount: string;
  contactEmail: string;
  notes: string;
  marginText: string;
  version: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    approved: string,
    utmSource: string,
    amount: string,
    contactEmail: string,
    notes: string,
    marginText: string,
    version: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.approved = approved;
    this.utmSource = utmSource;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.marginText = marginText;
    this.version = version;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSlaPreferenceView(item: ScheduledSlaPreference): ScheduledSlaPreferenceView {
  return new ScheduledSlaPreferenceView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    `${item.approved}`,
    text.truncate(item.utmSource, 120),
    item.amount.toFixed(2),
    item.contactEmail,
    item.notes,
    item.margin.toFixed(2),
    String(item.version),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSlaPreferenceViews(items: ScheduledSlaPreference[]): ScheduledSlaPreferenceView[] {
  const views: ScheduledSlaPreferenceView[] = [];
  for (const item of items) {
    views.push(toScheduledSlaPreferenceView(item));
  }
  return views;
}

export function sumScheduledSlaPreferenceView(view: ScheduledSlaPreferenceView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedThreshold + parsedAmount + parsedMargin;
}
