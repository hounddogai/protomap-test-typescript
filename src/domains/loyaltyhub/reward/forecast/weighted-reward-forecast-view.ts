import * as text from "../../../../kit/text.js";
import { WeightedRewardForecast } from "./weighted-reward-forecast.js";

/** How screens and exports show a weighted reward forecast. */
export class WeightedRewardForecastView {
  codeText: string;
  labelText: string;
  cohort: string;
  ratio: string;
  costText: string;
  ownerId: string;
  budget: string;
  countryText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cohort: string,
    ratio: string,
    costText: string,
    ownerId: string,
    budget: string,
    countryText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cohort = cohort;
    this.ratio = ratio;
    this.costText = costText;
    this.ownerId = ownerId;
    this.budget = budget;
    this.countryText = countryText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardForecastView(item: WeightedRewardForecast): WeightedRewardForecastView {
  return new WeightedRewardForecastView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    item.cohort,
    item.ratio.toFixed(2),
    item.cost.toFixed(2),
    item.ownerId,
    item.budget.toFixed(2),
    text.truncate(item.country, 120),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardForecastViews(items: WeightedRewardForecast[]): WeightedRewardForecastView[] {
  const views: WeightedRewardForecastView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardForecastView(item));
  }
  return views;
}

export function sumWeightedRewardForecastView(view: WeightedRewardForecastView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedCost + parsedBudget;
}
