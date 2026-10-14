import * as text from "../../../../kit/text.js";
import { LegacyBounceForecast } from "./legacy-bounce-forecast.js";

/** How screens and exports show a legacy bounce forecast. */
export class LegacyBounceForecastView {
  codeText: string;
  nameText: string;
  country: string;
  priority: string;
  descriptionText: string;
  phone: string;
  clicks: string;
  rate: string;
  journeyId: string;
  active: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    country: string,
    priority: string,
    descriptionText: string,
    phone: string,
    clicks: string,
    rate: string,
    journeyId: string,
    active: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.country = country;
    this.priority = priority;
    this.descriptionText = descriptionText;
    this.phone = phone;
    this.clicks = clicks;
    this.rate = rate;
    this.journeyId = journeyId;
    this.active = active;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBounceForecastView(item: LegacyBounceForecast): LegacyBounceForecastView {
  return new LegacyBounceForecastView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    item.country,
    String(item.priority),
    item.description,
    item.phone,
    String(item.clicks),
    item.rate.toFixed(2),
    item.journeyId,
    `${item.active}`,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBounceForecastViews(items: LegacyBounceForecast[]): LegacyBounceForecastView[] {
  const views: LegacyBounceForecastView[] = [];
  for (const item of items) {
    views.push(toLegacyBounceForecastView(item));
  }
  return views;
}

export function sumLegacyBounceForecastView(view: LegacyBounceForecastView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedPriority + parsedClicks + parsedRate;
}
