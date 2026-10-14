import * as text from "../../../../kit/text.js";
import { InsightForecast } from "./insight-forecast.js";

/** How screens and exports show a insight forecast. */
export class InsightForecastView {
  code: string;
  nameText: string;
  budget: string;
  windowDays: string;
  label: string;
  notes: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    windowDays: string,
    label: string,
    notes: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.windowDays = windowDays;
    this.label = label;
    this.notes = notes;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toInsightForecastView(item: InsightForecast): InsightForecastView {
  return new InsightForecastView(
    item.code,
    text.truncate(item.name, 40),
    item.budget.toFixed(2),
    String(item.windowDays),
    item.label,
    item.notes,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightForecastViews(items: InsightForecast[]): InsightForecastView[] {
  const views: InsightForecastView[] = [];
  for (const item of items) {
    views.push(toInsightForecastView(item));
  }
  return views;
}

export function sumInsightForecastView(view: InsightForecastView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBudget + parsedWindowDays;
}
