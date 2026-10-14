import * as text from "../../../../kit/text.js";
import { CappedStreakBudget } from "./capped-streak-budget.js";

/** How screens and exports show a capped streak budget. */
export class CappedStreakBudgetView {
  code: string;
  titleText: string;
  updatedAt: string;
  summary: string;
  variant: string;
  locale: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAt: string,
    summary: string,
    variant: string,
    locale: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.summary = summary;
    this.variant = variant;
    this.locale = locale;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toCappedStreakBudgetView(item: CappedStreakBudget): CappedStreakBudgetView {
  return new CappedStreakBudgetView(
    item.code,
    text.truncate(item.title, 80),
    String(item.updatedAt),
    item.summary,
    item.variant,
    text.truncate(item.locale, 120),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedStreakBudgetViews(items: CappedStreakBudget[]): CappedStreakBudgetView[] {
  const views: CappedStreakBudgetView[] = [];
  for (const item of items) {
    views.push(toCappedStreakBudgetView(item));
  }
  return views;
}

export function sumCappedStreakBudgetView(view: CappedStreakBudgetView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
