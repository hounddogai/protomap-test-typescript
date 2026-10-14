import * as text from "../../../../kit/text.js";
import { WeightedBadgeForecast } from "./weighted-badge-forecast.js";

/** How screens and exports show a weighted badge forecast. */
export class WeightedBadgeForecastView {
  code: string;
  labelText: string;
  cohortText: string;
  locale: string;
  margin: string;
  minimumText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cohortText: string,
    locale: string,
    margin: string,
    minimumText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cohortText = cohortText;
    this.locale = locale;
    this.margin = margin;
    this.minimumText = minimumText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBadgeForecastView(item: WeightedBadgeForecast): WeightedBadgeForecastView {
  return new WeightedBadgeForecastView(
    text.truncate(item.code, 40),
    item.label,
    item.cohort,
    item.locale,
    item.margin.toFixed(2),
    item.minimum.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBadgeForecastViews(items: WeightedBadgeForecast[]): WeightedBadgeForecastView[] {
  const views: WeightedBadgeForecastView[] = [];
  for (const item of items) {
    views.push(toWeightedBadgeForecastView(item));
  }
  return views;
}

export function sumWeightedBadgeForecastView(view: WeightedBadgeForecastView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedMargin + parsedMinimum + parsedDiscount;
}
