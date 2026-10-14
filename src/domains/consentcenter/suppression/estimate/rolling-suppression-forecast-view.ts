import * as text from "../../../../kit/text.js";
import { RollingSuppressionForecast } from "./rolling-suppression-forecast.js";

/** How screens and exports show a rolling suppression forecast. */
export class RollingSuppressionForecastView {
  codeText: string;
  label: string;
  unitText: string;
  frequencyCap: string;
  updatedAt: string;
  country: string;
  segment: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    unitText: string,
    frequencyCap: string,
    updatedAt: string,
    country: string,
    segment: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.unitText = unitText;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.country = country;
    this.segment = segment;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSuppressionForecastView(item: RollingSuppressionForecast): RollingSuppressionForecastView {
  return new RollingSuppressionForecastView(
    item.code,
    text.truncate(item.label, 120),
    item.unit,
    String(item.frequencyCap),
    String(item.updatedAt),
    item.country,
    text.truncate(item.segment, 80),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSuppressionForecastViews(items: RollingSuppressionForecast[]): RollingSuppressionForecastView[] {
  const views: RollingSuppressionForecastView[] = [];
  for (const item of items) {
    views.push(toRollingSuppressionForecastView(item));
  }
  return views;
}

export function sumRollingSuppressionForecastView(view: RollingSuppressionForecastView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedFrequencyCap + parsedUpdatedAt + parsedConversionRate;
}
