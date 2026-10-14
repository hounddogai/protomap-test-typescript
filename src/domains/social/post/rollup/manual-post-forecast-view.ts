import * as text from "../../../../kit/text.js";
import { ManualPostForecast } from "./manual-post-forecast.js";

/** How screens and exports show a manual post forecast. */
export class ManualPostForecastView {
  code: string;
  name: string;
  minimum: string;
  bidText: string;
  source: string;
  batchSizeText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimum: string,
    bidText: string,
    source: string,
    batchSizeText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.bidText = bidText;
    this.source = source;
    this.batchSizeText = batchSizeText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toManualPostForecastView(item: ManualPostForecast): ManualPostForecastView {
  return new ManualPostForecastView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.source, 120),
    String(item.batchSize),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPostForecastViews(items: ManualPostForecast[]): ManualPostForecastView[] {
  const views: ManualPostForecastView[] = [];
  for (const item of items) {
    views.push(toManualPostForecastView(item));
  }
  return views;
}

export function sumManualPostForecastView(view: ManualPostForecastView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedMinimum + parsedBid + parsedBatchSize;
}
