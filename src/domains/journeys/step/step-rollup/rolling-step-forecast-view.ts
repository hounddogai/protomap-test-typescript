import * as text from "../../../../kit/text.js";
import { RollingStepForecast } from "./rolling-step-forecast.js";

/** How screens and exports show a rolling step forecast. */
export class RollingStepForecastView {
  codeText: string;
  labelText: string;
  pinnedText: string;
  cost: string;
  conversionRateText: string;
  unitText: string;
  margin: string;
  rate: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    pinnedText: string,
    cost: string,
    conversionRateText: string,
    unitText: string,
    margin: string,
    rate: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.pinnedText = pinnedText;
    this.cost = cost;
    this.conversionRateText = conversionRateText;
    this.unitText = unitText;
    this.margin = margin;
    this.rate = rate;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toRollingStepForecastView(item: RollingStepForecast): RollingStepForecastView {
  return new RollingStepForecastView(
    text.truncate(item.code, 64),
    item.label,
    `${item.pinned}`,
    item.cost.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.unit, 80),
    item.margin.toFixed(2),
    item.rate.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingStepForecastViews(items: RollingStepForecast[]): RollingStepForecastView[] {
  const views: RollingStepForecastView[] = [];
  for (const item of items) {
    views.push(toRollingStepForecastView(item));
  }
  return views;
}

export function sumRollingStepForecastView(view: RollingStepForecastView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedCost + parsedConversionRate + parsedMargin;
}
