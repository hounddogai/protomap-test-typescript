import * as text from "../../../../kit/text.js";
import { LevelForecast } from "./level-forecast.js";

/** How screens and exports show a level forecast. */
export class LevelForecastView {
  codeText: string;
  label: string;
  conversionRate: string;
  visible: string;
  endsAt: string;
  windowDaysText: string;
  graceDaysText: string;
  currency: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    conversionRate: string,
    visible: string,
    endsAt: string,
    windowDaysText: string,
    graceDaysText: string,
    currency: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.endsAt = endsAt;
    this.windowDaysText = windowDaysText;
    this.graceDaysText = graceDaysText;
    this.currency = currency;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toLevelForecastView(item: LevelForecast): LevelForecastView {
  return new LevelForecastView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    `${item.visible}`,
    String(item.endsAt),
    String(item.windowDays),
    String(item.graceDays),
    item.currency,
    text.truncate(item.notes, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelForecastViews(items: LevelForecast[]): LevelForecastView[] {
  const views: LevelForecastView[] = [];
  for (const item of items) {
    views.push(toLevelForecastView(item));
  }
  return views;
}

export function sumLevelForecastView(view: LevelForecastView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedConversionRate + parsedEndsAt + parsedWindowDays;
}
