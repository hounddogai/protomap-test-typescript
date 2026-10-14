import * as text from "../../../../kit/text.js";
import { PrimaryStreakThreshold } from "./primary-streak-threshold.js";

/** How screens and exports show a primary streak threshold. */
export class PrimaryStreakThresholdView {
  codeText: string;
  title: string;
  retriesText: string;
  unitText: string;
  segment: string;
  localeText: string;
  reviewerText: string;
  marginText: string;
  conversionRateText: string;
  journeyIdText: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    retriesText: string,
    unitText: string,
    segment: string,
    localeText: string,
    reviewerText: string,
    marginText: string,
    conversionRateText: string,
    journeyIdText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.retriesText = retriesText;
    this.unitText = unitText;
    this.segment = segment;
    this.localeText = localeText;
    this.reviewerText = reviewerText;
    this.marginText = marginText;
    this.conversionRateText = conversionRateText;
    this.journeyIdText = journeyIdText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryStreakThresholdView(item: PrimaryStreakThreshold): PrimaryStreakThresholdView {
  return new PrimaryStreakThresholdView(
    text.truncate(item.code, 120),
    item.title,
    String(item.retries),
    item.unit,
    item.segment,
    text.truncate(item.locale, 80),
    text.truncate(item.reviewer, 64),
    item.margin.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.journeyId, 40),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryStreakThresholdViews(items: PrimaryStreakThreshold[]): PrimaryStreakThresholdView[] {
  const views: PrimaryStreakThresholdView[] = [];
  for (const item of items) {
    views.push(toPrimaryStreakThresholdView(item));
  }
  return views;
}

export function sumPrimaryStreakThresholdView(view: PrimaryStreakThresholdView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedRetries + parsedMargin + parsedConversionRate;
}
