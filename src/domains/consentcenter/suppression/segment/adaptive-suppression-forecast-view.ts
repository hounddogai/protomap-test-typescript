import * as text from "../../../../kit/text.js";
import { AdaptiveSuppressionForecast } from "./adaptive-suppression-forecast.js";

/** How screens and exports show a adaptive suppression forecast. */
export class AdaptiveSuppressionForecastView {
  code: string;
  titleText: string;
  durationMinutes: string;
  priority: string;
  capacity: string;
  batchSize: string;
  frequencyCap: string;
  region: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    durationMinutes: string,
    priority: string,
    capacity: string,
    batchSize: string,
    frequencyCap: string,
    region: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.region = region;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSuppressionForecastView(item: AdaptiveSuppressionForecast): AdaptiveSuppressionForecastView {
  return new AdaptiveSuppressionForecastView(
    item.code,
    text.truncate(item.title, 120),
    String(item.durationMinutes),
    String(item.priority),
    String(item.capacity),
    String(item.batchSize),
    String(item.frequencyCap),
    item.region,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSuppressionForecastViews(items: AdaptiveSuppressionForecast[]): AdaptiveSuppressionForecastView[] {
  const views: AdaptiveSuppressionForecastView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSuppressionForecastView(item));
  }
  return views;
}

export function sumAdaptiveSuppressionForecastView(view: AdaptiveSuppressionForecastView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedDurationMinutes + parsedPriority + parsedCapacity;
}
