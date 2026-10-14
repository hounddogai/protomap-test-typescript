import * as text from "../../../../kit/text.js";
import { ScheduledNudgeForecast } from "./scheduled-nudge-forecast.js";

/** How screens and exports show a scheduled nudge forecast. */
export class ScheduledNudgeForecastView {
  codeText: string;
  titleText: string;
  phone: string;
  limitText: string;
  visible: string;
  thresholdText: string;
  pinned: string;
  minimum: string;
  attemptsText: string;
  name: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    phone: string,
    limitText: string,
    visible: string,
    thresholdText: string,
    pinned: string,
    minimum: string,
    attemptsText: string,
    name: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.phone = phone;
    this.limitText = limitText;
    this.visible = visible;
    this.thresholdText = thresholdText;
    this.pinned = pinned;
    this.minimum = minimum;
    this.attemptsText = attemptsText;
    this.name = name;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledNudgeForecastView(item: ScheduledNudgeForecast): ScheduledNudgeForecastView {
  return new ScheduledNudgeForecastView(
    text.truncate(item.code, 80),
    item.title,
    text.truncate(item.phone, 40),
    String(item.limit),
    `${item.visible}`,
    item.threshold.toFixed(2),
    `${item.pinned}`,
    item.minimum.toFixed(2),
    String(item.attempts),
    item.name,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledNudgeForecastViews(items: ScheduledNudgeForecast[]): ScheduledNudgeForecastView[] {
  const views: ScheduledNudgeForecastView[] = [];
  for (const item of items) {
    views.push(toScheduledNudgeForecastView(item));
  }
  return views;
}

export function sumScheduledNudgeForecastView(view: ScheduledNudgeForecastView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedLimit + parsedThreshold + parsedMinimum;
}
