import * as text from "../../../../kit/text.js";
import { RedemptionForecast } from "./redemption-forecast.js";

/** How screens and exports show a redemption forecast. */
export class RedemptionForecastView {
  code: string;
  nameText: string;
  batchSize: string;
  maximum: string;
  reviewerText: string;
  unit: string;
  currency: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    batchSize: string,
    maximum: string,
    reviewerText: string,
    unit: string,
    currency: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.reviewerText = reviewerText;
    this.unit = unit;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionForecastView(item: RedemptionForecast): RedemptionForecastView {
  return new RedemptionForecastView(
    item.code,
    text.truncate(item.name, 120),
    String(item.batchSize),
    item.maximum.toFixed(2),
    item.reviewer,
    item.unit,
    text.truncate(item.currency, 40),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionForecastViews(items: RedemptionForecast[]): RedemptionForecastView[] {
  const views: RedemptionForecastView[] = [];
  for (const item of items) {
    views.push(toRedemptionForecastView(item));
  }
  return views;
}

export function sumRedemptionForecastView(view: RedemptionForecastView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedBatchSize + parsedMaximum;
}
