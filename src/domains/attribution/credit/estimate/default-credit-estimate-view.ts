import * as text from "../../../../kit/text.js";
import { DefaultCreditEstimate } from "./default-credit-estimate.js";

/** How screens and exports show a default credit estimate. */
export class DefaultCreditEstimateView {
  code: string;
  name: string;
  budget: string;
  minimum: string;
  clicks: string;
  bidText: string;
  durationMinutes: string;
  category: string;
  updatedAt: string;
  summaryText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    minimum: string,
    clicks: string,
    bidText: string,
    durationMinutes: string,
    category: string,
    updatedAt: string,
    summaryText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.minimum = minimum;
    this.clicks = clicks;
    this.bidText = bidText;
    this.durationMinutes = durationMinutes;
    this.category = category;
    this.updatedAt = updatedAt;
    this.summaryText = summaryText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCreditEstimateView(item: DefaultCreditEstimate): DefaultCreditEstimateView {
  return new DefaultCreditEstimateView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    item.budget.toFixed(2),
    item.minimum.toFixed(2),
    String(item.clicks),
    item.bid.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.category, 120),
    String(item.updatedAt),
    item.summary,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCreditEstimateViews(items: DefaultCreditEstimate[]): DefaultCreditEstimateView[] {
  const views: DefaultCreditEstimateView[] = [];
  for (const item of items) {
    views.push(toDefaultCreditEstimateView(item));
  }
  return views;
}

export function sumDefaultCreditEstimateView(view: DefaultCreditEstimateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBudget + parsedMinimum + parsedClicks;
}
