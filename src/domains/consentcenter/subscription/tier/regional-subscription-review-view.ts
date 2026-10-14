import * as text from "../../../../kit/text.js";
import { RegionalSubscriptionReview } from "./regional-subscription-review.js";

/** How screens and exports show a regional subscription review. */
export class RegionalSubscriptionReviewView {
  code: string;
  label: string;
  thresholdText: string;
  graceDays: string;
  locale: string;
  conversionRate: string;
  campaignRefText: string;
  archived: string;
  phone: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    thresholdText: string,
    graceDays: string,
    locale: string,
    conversionRate: string,
    campaignRefText: string,
    archived: string,
    phone: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.thresholdText = thresholdText;
    this.graceDays = graceDays;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.campaignRefText = campaignRefText;
    this.archived = archived;
    this.phone = phone;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSubscriptionReviewView(item: RegionalSubscriptionReview): RegionalSubscriptionReviewView {
  return new RegionalSubscriptionReviewView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.threshold.toFixed(2),
    String(item.graceDays),
    text.truncate(item.locale, 80),
    item.conversionRate.toFixed(2),
    text.truncate(item.campaignRef, 120),
    `${item.archived}`,
    text.truncate(item.phone, 40),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSubscriptionReviewViews(items: RegionalSubscriptionReview[]): RegionalSubscriptionReviewView[] {
  const views: RegionalSubscriptionReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalSubscriptionReviewView(item));
  }
  return views;
}

export function sumRegionalSubscriptionReviewView(view: RegionalSubscriptionReviewView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedThreshold + parsedGraceDays + parsedConversionRate;
}
