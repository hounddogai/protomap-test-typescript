import * as text from "../../../../kit/text.js";
import { AdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

/** How screens and exports show a adaptive touchpoint forecast. */
export class AdaptiveTouchpointForecastView {
  code: string;
  name: string;
  unit: string;
  frequencyCapText: string;
  conversionRateText: string;
  description: string;
  sequence: string;
  clicksText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    frequencyCapText: string,
    conversionRateText: string,
    description: string,
    sequence: string,
    clicksText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.frequencyCapText = frequencyCapText;
    this.conversionRateText = conversionRateText;
    this.description = description;
    this.sequence = sequence;
    this.clicksText = clicksText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTouchpointForecastView(item: AdaptiveTouchpointForecast): AdaptiveTouchpointForecastView {
  return new AdaptiveTouchpointForecastView(
    item.code,
    item.name,
    item.unit,
    String(item.frequencyCap),
    item.conversionRate.toFixed(2),
    text.truncate(item.description, 64),
    String(item.sequence),
    String(item.clicks),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTouchpointForecastViews(items: AdaptiveTouchpointForecast[]): AdaptiveTouchpointForecastView[] {
  const views: AdaptiveTouchpointForecastView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTouchpointForecastView(item));
  }
  return views;
}

export function sumAdaptiveTouchpointForecastView(view: AdaptiveTouchpointForecastView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedFrequencyCap + parsedConversionRate + parsedSequence;
}
