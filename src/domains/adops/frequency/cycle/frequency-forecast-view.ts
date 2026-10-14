import * as text from "../../../../kit/text.js";
import { FrequencyForecast } from "./frequency-forecast.js";

/** How screens and exports show a frequency forecast. */
export class FrequencyForecastView {
  code: string;
  labelText: string;
  minimum: string;
  currency: string;
  notes: string;
  graceDays: string;
  unit: string;
  visible: string;
  campaignRef: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    minimum: string,
    currency: string,
    notes: string,
    graceDays: string,
    unit: string,
    visible: string,
    campaignRef: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.minimum = minimum;
    this.currency = currency;
    this.notes = notes;
    this.graceDays = graceDays;
    this.unit = unit;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyForecastView(item: FrequencyForecast): FrequencyForecastView {
  return new FrequencyForecastView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    text.truncate(item.currency, 40),
    text.truncate(item.notes, 40),
    String(item.graceDays),
    text.truncate(item.unit, 64),
    `${item.visible}`,
    item.campaignRef,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyForecastViews(items: FrequencyForecast[]): FrequencyForecastView[] {
  const views: FrequencyForecastView[] = [];
  for (const item of items) {
    views.push(toFrequencyForecastView(item));
  }
  return views;
}

export function sumFrequencyForecastView(view: FrequencyForecastView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedMinimum + parsedGraceDays;
}
