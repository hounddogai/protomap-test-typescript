import * as text from "../../../../kit/text.js";
import { StrictPlacementForecast } from "./strict-placement-forecast.js";

/** How screens and exports show a strict placement forecast. */
export class StrictPlacementForecastView {
  codeText: string;
  title: string;
  locale: string;
  channel: string;
  ratio: string;
  updatedAt: string;
  budget: string;
  variant: string;
  maximum: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    channel: string,
    ratio: string,
    updatedAt: string,
    budget: string,
    variant: string,
    maximum: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.channel = channel;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.variant = variant;
    this.maximum = maximum;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPlacementForecastView(item: StrictPlacementForecast): StrictPlacementForecastView {
  return new StrictPlacementForecastView(
    item.code,
    item.title,
    text.truncate(item.locale, 40),
    text.truncate(item.channel, 80),
    item.ratio.toFixed(2),
    String(item.updatedAt),
    item.budget.toFixed(2),
    text.truncate(item.variant, 120),
    item.maximum.toFixed(2),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPlacementForecastViews(items: StrictPlacementForecast[]): StrictPlacementForecastView[] {
  const views: StrictPlacementForecastView[] = [];
  for (const item of items) {
    views.push(toStrictPlacementForecastView(item));
  }
  return views;
}

export function sumStrictPlacementForecastView(view: StrictPlacementForecastView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedUpdatedAt + parsedBudget;
}
