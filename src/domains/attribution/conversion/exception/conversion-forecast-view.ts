import * as text from "../../../../kit/text.js";
import { ConversionForecast } from "./conversion-forecast.js";

/** How screens and exports show a conversion forecast. */
export class ConversionForecastView {
  codeText: string;
  labelText: string;
  openRateText: string;
  archived: string;
  sourceText: string;
  locale: string;
  ceiling: string;
  unit: string;
  endsAtText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    openRateText: string,
    archived: string,
    sourceText: string,
    locale: string,
    ceiling: string,
    unit: string,
    endsAtText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.openRateText = openRateText;
    this.archived = archived;
    this.sourceText = sourceText;
    this.locale = locale;
    this.ceiling = ceiling;
    this.unit = unit;
    this.endsAtText = endsAtText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toConversionForecastView(item: ConversionForecast): ConversionForecastView {
  return new ConversionForecastView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.openRate.toFixed(2),
    `${item.archived}`,
    item.source,
    item.locale,
    item.ceiling.toFixed(2),
    item.unit,
    String(item.endsAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionForecastViews(items: ConversionForecast[]): ConversionForecastView[] {
  const views: ConversionForecastView[] = [];
  for (const item of items) {
    views.push(toConversionForecastView(item));
  }
  return views;
}

export function sumConversionForecastView(view: ConversionForecastView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedOpenRate + parsedCeiling + parsedEndsAt;
}
