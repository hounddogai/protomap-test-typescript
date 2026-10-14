import { TieredPacingReview } from "./tiered-pacing-review.js";

/** How screens and exports show a tiered pacing review. */
export class TieredPacingReviewView {
  code: string;
  name: string;
  conversionRateText: string;
  discountText: string;
  limit: string;
  thresholdText: string;
  channel: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    conversionRateText: string,
    discountText: string,
    limit: string,
    thresholdText: string,
    channel: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRateText = conversionRateText;
    this.discountText = discountText;
    this.limit = limit;
    this.thresholdText = thresholdText;
    this.channel = channel;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPacingReviewView(item: TieredPacingReview): TieredPacingReviewView {
  return new TieredPacingReviewView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    item.discount.toFixed(2),
    String(item.limit),
    item.threshold.toFixed(2),
    item.channel,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPacingReviewViews(items: TieredPacingReview[]): TieredPacingReviewView[] {
  const views: TieredPacingReviewView[] = [];
  for (const item of items) {
    views.push(toTieredPacingReviewView(item));
  }
  return views;
}

export function sumTieredPacingReviewView(view: TieredPacingReviewView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedConversionRate + parsedDiscount + parsedLimit;
}
