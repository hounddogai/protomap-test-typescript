import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

/** How screens and exports show a legacy double opt in forecast. */
export class LegacyDoubleOptInForecastView {
  code: string;
  title: string;
  thresholdText: string;
  sequence: string;
  externalRef: string;
  phone: string;
  region: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    thresholdText: string,
    sequence: string,
    externalRef: string,
    phone: string,
    region: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.thresholdText = thresholdText;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.phone = phone;
    this.region = region;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyDoubleOptInForecastView(item: LegacyDoubleOptInForecast): LegacyDoubleOptInForecastView {
  return new LegacyDoubleOptInForecastView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 120),
    item.threshold.toFixed(2),
    String(item.sequence),
    item.externalRef,
    item.phone,
    text.truncate(item.region, 40),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyDoubleOptInForecastViews(items: LegacyDoubleOptInForecast[]): LegacyDoubleOptInForecastView[] {
  const views: LegacyDoubleOptInForecastView[] = [];
  for (const item of items) {
    views.push(toLegacyDoubleOptInForecastView(item));
  }
  return views;
}

export function sumLegacyDoubleOptInForecastView(view: LegacyDoubleOptInForecastView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedThreshold + parsedSequence + parsedDurationMinutes;
}
