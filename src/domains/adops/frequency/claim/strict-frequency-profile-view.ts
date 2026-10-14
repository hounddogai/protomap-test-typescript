import * as text from "../../../../kit/text.js";
import { StrictFrequencyProfile } from "./strict-frequency-profile.js";

/** How screens and exports show a strict frequency profile. */
export class StrictFrequencyProfileView {
  code: string;
  title: string;
  reviewer: string;
  conversionRateText: string;
  discount: string;
  minimumText: string;
  clicksText: string;
  graceDaysText: string;
  maximumText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    conversionRateText: string,
    discount: string,
    minimumText: string,
    clicksText: string,
    graceDaysText: string,
    maximumText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.conversionRateText = conversionRateText;
    this.discount = discount;
    this.minimumText = minimumText;
    this.clicksText = clicksText;
    this.graceDaysText = graceDaysText;
    this.maximumText = maximumText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFrequencyProfileView(item: StrictFrequencyProfile): StrictFrequencyProfileView {
  return new StrictFrequencyProfileView(
    item.code,
    text.truncate(item.title, 64),
    item.reviewer,
    item.conversionRate.toFixed(2),
    item.discount.toFixed(2),
    item.minimum.toFixed(2),
    String(item.clicks),
    String(item.graceDays),
    item.maximum.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFrequencyProfileViews(items: StrictFrequencyProfile[]): StrictFrequencyProfileView[] {
  const views: StrictFrequencyProfileView[] = [];
  for (const item of items) {
    views.push(toStrictFrequencyProfileView(item));
  }
  return views;
}

export function sumStrictFrequencyProfileView(view: StrictFrequencyProfileView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedConversionRate + parsedDiscount + parsedMinimum;
}
