import * as text from "../../../../kit/text.js";
import { LegacyInsightForecast } from "./legacy-insight-forecast.js";

/** How screens and exports show a legacy insight forecast. */
export class LegacyInsightForecastView {
  code: string;
  labelText: string;
  category: string;
  capacityText: string;
  cost: string;
  locale: string;
  durationMinutes: string;
  sequenceText: string;
  country: string;
  maximumText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    category: string,
    capacityText: string,
    cost: string,
    locale: string,
    durationMinutes: string,
    sequenceText: string,
    country: string,
    maximumText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.category = category;
    this.capacityText = capacityText;
    this.cost = cost;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.sequenceText = sequenceText;
    this.country = country;
    this.maximumText = maximumText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyInsightForecastView(item: LegacyInsightForecast): LegacyInsightForecastView {
  return new LegacyInsightForecastView(
    item.code,
    item.label,
    text.truncate(item.category, 64),
    String(item.capacity),
    item.cost.toFixed(2),
    text.truncate(item.locale, 80),
    String(item.durationMinutes),
    String(item.sequence),
    item.country,
    item.maximum.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyInsightForecastViews(items: LegacyInsightForecast[]): LegacyInsightForecastView[] {
  const views: LegacyInsightForecastView[] = [];
  for (const item of items) {
    views.push(toLegacyInsightForecastView(item));
  }
  return views;
}

export function sumLegacyInsightForecastView(view: LegacyInsightForecastView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCapacity + parsedCost + parsedDurationMinutes;
}
