import * as text from "../../../../kit/text.js";
import { SenderForecast } from "./sender-forecast.js";

/** How screens and exports show a sender forecast. */
export class SenderForecastView {
  code: string;
  name: string;
  threshold: string;
  amountText: string;
  budget: string;
  channel: string;
  reviewer: string;
  checksum: string;
  pinned: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    amountText: string,
    budget: string,
    channel: string,
    reviewer: string,
    checksum: string,
    pinned: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.amountText = amountText;
    this.budget = budget;
    this.channel = channel;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.pinned = pinned;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toSenderForecastView(item: SenderForecast): SenderForecastView {
  return new SenderForecastView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 80),
    item.threshold.toFixed(2),
    item.amount.toFixed(2),
    item.budget.toFixed(2),
    item.channel,
    item.reviewer,
    text.truncate(item.checksum, 120),
    `${item.pinned}`,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderForecastViews(items: SenderForecast[]): SenderForecastView[] {
  const views: SenderForecastView[] = [];
  for (const item of items) {
    views.push(toSenderForecastView(item));
  }
  return views;
}

export function sumSenderForecastView(view: SenderForecastView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedThreshold + parsedAmount + parsedBudget;
}
