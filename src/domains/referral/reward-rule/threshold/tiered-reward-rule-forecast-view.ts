import * as text from "../../../../kit/text.js";
import { TieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

/** How screens and exports show a tiered reward rule forecast. */
export class TieredRewardRuleForecastView {
  code: string;
  title: string;
  priority: string;
  discountText: string;
  ratio: string;
  notesText: string;
  margin: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priority: string,
    discountText: string,
    ratio: string,
    notesText: string,
    margin: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.discountText = discountText;
    this.ratio = ratio;
    this.notesText = notesText;
    this.margin = margin;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleForecastView(item: TieredRewardRuleForecast): TieredRewardRuleForecastView {
  return new TieredRewardRuleForecastView(
    text.truncate(item.code, 120),
    item.title,
    String(item.priority),
    item.discount.toFixed(2),
    item.ratio.toFixed(2),
    item.notes,
    item.margin.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleForecastViews(items: TieredRewardRuleForecast[]): TieredRewardRuleForecastView[] {
  const views: TieredRewardRuleForecastView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleForecastView(item));
  }
  return views;
}

export function sumTieredRewardRuleForecastView(view: TieredRewardRuleForecastView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedPriority + parsedDiscount + parsedRatio;
}
