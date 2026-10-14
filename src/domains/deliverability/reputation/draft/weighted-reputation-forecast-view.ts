import * as text from "../../../../kit/text.js";
import { WeightedReputationForecast } from "./weighted-reputation-forecast.js";

/** How screens and exports show a weighted reputation forecast. */
export class WeightedReputationForecastView {
  code: string;
  title: string;
  version: string;
  locale: string;
  score: string;
  country: string;
  weight: string;
  quantity: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    version: string,
    locale: string,
    score: string,
    country: string,
    weight: string,
    quantity: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.locale = locale;
    this.score = score;
    this.country = country;
    this.weight = weight;
    this.quantity = quantity;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationForecastView(item: WeightedReputationForecast): WeightedReputationForecastView {
  return new WeightedReputationForecastView(
    item.code,
    text.truncate(item.title, 64),
    String(item.version),
    item.locale,
    item.score.toFixed(2),
    item.country,
    item.weight.toFixed(2),
    String(item.quantity),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationForecastViews(items: WeightedReputationForecast[]): WeightedReputationForecastView[] {
  const views: WeightedReputationForecastView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationForecastView(item));
  }
  return views;
}

export function sumWeightedReputationForecastView(view: WeightedReputationForecastView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedVersion + parsedScore + parsedWeight;
}
