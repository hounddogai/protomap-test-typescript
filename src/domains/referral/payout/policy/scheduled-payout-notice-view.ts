import * as text from "../../../../kit/text.js";
import { ScheduledPayoutNotice } from "./scheduled-payout-notice.js";

/** How screens and exports show a scheduled payout notice. */
export class ScheduledPayoutNoticeView {
  code: string;
  title: string;
  campaignRefText: string;
  archived: string;
  conversionRate: string;
  limit: string;
  locale: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRefText: string,
    archived: string,
    conversionRate: string,
    limit: string,
    locale: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.limit = limit;
    this.locale = locale;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPayoutNoticeView(item: ScheduledPayoutNotice): ScheduledPayoutNoticeView {
  return new ScheduledPayoutNoticeView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.campaignRef, 64),
    `${item.archived}`,
    item.conversionRate.toFixed(2),
    String(item.limit),
    text.truncate(item.locale, 80),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPayoutNoticeViews(items: ScheduledPayoutNotice[]): ScheduledPayoutNoticeView[] {
  const views: ScheduledPayoutNoticeView[] = [];
  for (const item of items) {
    views.push(toScheduledPayoutNoticeView(item));
  }
  return views;
}

export function sumScheduledPayoutNoticeView(view: ScheduledPayoutNoticeView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedConversionRate + parsedLimit + parsedRetries;
}
