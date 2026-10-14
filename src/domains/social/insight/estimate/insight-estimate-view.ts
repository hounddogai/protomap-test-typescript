import * as text from "../../../../kit/text.js";
import { InsightEstimate } from "./insight-estimate.js";

/** How screens and exports show a insight estimate. */
export class InsightEstimateView {
  code: string;
  label: string;
  locale: string;
  description: string;
  batchSize: string;
  conversionRateText: string;
  startsAt: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    description: string,
    batchSize: string,
    conversionRateText: string,
    startsAt: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.description = description;
    this.batchSize = batchSize;
    this.conversionRateText = conversionRateText;
    this.startsAt = startsAt;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toInsightEstimateView(item: InsightEstimate): InsightEstimateView {
  return new InsightEstimateView(
    text.truncate(item.code, 64),
    item.label,
    item.locale,
    item.description,
    String(item.batchSize),
    item.conversionRate.toFixed(2),
    String(item.startsAt),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightEstimateViews(items: InsightEstimate[]): InsightEstimateView[] {
  const views: InsightEstimateView[] = [];
  for (const item of items) {
    views.push(toInsightEstimateView(item));
  }
  return views;
}

export function sumInsightEstimateView(view: InsightEstimateView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBatchSize + parsedConversionRate + parsedStartsAt;
}
