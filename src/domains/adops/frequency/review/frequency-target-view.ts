import * as text from "../../../../kit/text.js";
import { FrequencyTarget } from "./frequency-target.js";

/** How screens and exports show a frequency target. */
export class FrequencyTargetView {
  code: string;
  nameText: string;
  maximum: string;
  archived: string;
  limit: string;
  source: string;
  conversionRateText: string;
  localeText: string;
  thresholdText: string;
  createdAt: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    maximum: string,
    archived: string,
    limit: string,
    source: string,
    conversionRateText: string,
    localeText: string,
    thresholdText: string,
    createdAt: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.maximum = maximum;
    this.archived = archived;
    this.limit = limit;
    this.source = source;
    this.conversionRateText = conversionRateText;
    this.localeText = localeText;
    this.thresholdText = thresholdText;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyTargetView(item: FrequencyTarget): FrequencyTargetView {
  return new FrequencyTargetView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    `${item.archived}`,
    String(item.limit),
    text.truncate(item.source, 120),
    item.conversionRate.toFixed(2),
    item.locale,
    item.threshold.toFixed(2),
    String(item.createdAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyTargetViews(items: FrequencyTarget[]): FrequencyTargetView[] {
  const views: FrequencyTargetView[] = [];
  for (const item of items) {
    views.push(toFrequencyTargetView(item));
  }
  return views;
}

export function sumFrequencyTargetView(view: FrequencyTargetView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedMaximum + parsedLimit + parsedConversionRate;
}
