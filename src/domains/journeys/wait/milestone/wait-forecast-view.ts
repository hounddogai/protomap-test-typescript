import * as text from "../../../../kit/text.js";
import { WaitForecast } from "./wait-forecast.js";

/** How screens and exports show a wait forecast. */
export class WaitForecastView {
  code: string;
  title: string;
  ownerId: string;
  summary: string;
  cohort: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    summary: string,
    cohort: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.summary = summary;
    this.cohort = cohort;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toWaitForecastView(item: WaitForecast): WaitForecastView {
  return new WaitForecastView(
    item.code,
    item.title,
    text.truncate(item.ownerId, 40),
    text.truncate(item.summary, 120),
    text.truncate(item.cohort, 80),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitForecastViews(items: WaitForecast[]): WaitForecastView[] {
  const views: WaitForecastView[] = [];
  for (const item of items) {
    views.push(toWaitForecastView(item));
  }
  return views;
}

export function sumWaitForecastView(view: WaitForecastView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
