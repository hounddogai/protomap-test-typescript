import * as text from "../../../../kit/text.js";
import { PendingStreakBudget } from "./pending-streak-budget.js";

/** How screens and exports show a pending streak budget. */
export class PendingStreakBudgetView {
  codeText: string;
  title: string;
  durationMinutes: string;
  country: string;
  marginText: string;
  timezone: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    durationMinutes: string,
    country: string,
    marginText: string,
    timezone: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.country = country;
    this.marginText = marginText;
    this.timezone = timezone;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toPendingStreakBudgetView(item: PendingStreakBudget): PendingStreakBudgetView {
  return new PendingStreakBudgetView(
    item.code,
    item.title,
    String(item.durationMinutes),
    item.country,
    item.margin.toFixed(2),
    text.truncate(item.timezone, 40),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingStreakBudgetViews(items: PendingStreakBudget[]): PendingStreakBudgetView[] {
  const views: PendingStreakBudgetView[] = [];
  for (const item of items) {
    views.push(toPendingStreakBudgetView(item));
  }
  return views;
}

export function sumPendingStreakBudgetView(view: PendingStreakBudgetView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedDurationMinutes + parsedMargin;
}
