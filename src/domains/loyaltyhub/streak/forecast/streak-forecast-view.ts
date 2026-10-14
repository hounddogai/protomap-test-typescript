import * as text from "../../../../kit/text.js";
import { StreakForecast } from "./streak-forecast.js";

/** How screens and exports show a streak forecast. */
export class StreakForecastView {
  codeText: string;
  title: string;
  budgetText: string;
  expiresAt: string;
  impressionsText: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budgetText: string,
    expiresAt: string,
    impressionsText: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budgetText = budgetText;
    this.expiresAt = expiresAt;
    this.impressionsText = impressionsText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toStreakForecastView(item: StreakForecast): StreakForecastView {
  return new StreakForecastView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    String(item.expiresAt),
    String(item.impressions),
    text.truncate(item.source, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakForecastViews(items: StreakForecast[]): StreakForecastView[] {
  const views: StreakForecastView[] = [];
  for (const item of items) {
    views.push(toStreakForecastView(item));
  }
  return views;
}

export function sumStreakForecastView(view: StreakForecastView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBudget + parsedExpiresAt + parsedImpressions;
}
