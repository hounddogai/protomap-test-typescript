import * as text from "../../../../kit/text.js";
import { ScheduledReplyException } from "./scheduled-reply-exception.js";

/** How screens and exports show a scheduled reply exception. */
export class ScheduledReplyExceptionView {
  code: string;
  name: string;
  phone: string;
  campaignRefText: string;
  rate: string;
  timezoneText: string;
  externalRef: string;
  contactEmail: string;
  currency: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    campaignRefText: string,
    rate: string,
    timezoneText: string,
    externalRef: string,
    contactEmail: string,
    currency: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.campaignRefText = campaignRefText;
    this.rate = rate;
    this.timezoneText = timezoneText;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledReplyExceptionView(item: ScheduledReplyException): ScheduledReplyExceptionView {
  return new ScheduledReplyExceptionView(
    item.code,
    text.truncate(item.name, 40),
    item.phone,
    item.campaignRef,
    item.rate.toFixed(2),
    item.timezone,
    item.externalRef,
    item.contactEmail,
    item.currency,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledReplyExceptionViews(items: ScheduledReplyException[]): ScheduledReplyExceptionView[] {
  const views: ScheduledReplyExceptionView[] = [];
  for (const item of items) {
    views.push(toScheduledReplyExceptionView(item));
  }
  return views;
}

export function sumScheduledReplyExceptionView(view: ScheduledReplyExceptionView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
