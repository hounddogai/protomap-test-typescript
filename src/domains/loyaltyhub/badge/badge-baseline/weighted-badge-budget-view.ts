import * as text from "../../../../kit/text.js";
import { WeightedBadgeBudget } from "./weighted-badge-budget.js";

/** How screens and exports show a weighted badge budget. */
export class WeightedBadgeBudgetView {
  codeText: string;
  titleText: string;
  limitText: string;
  utmSource: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    limitText: string,
    utmSource: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.limitText = limitText;
    this.utmSource = utmSource;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBadgeBudgetView(item: WeightedBadgeBudget): WeightedBadgeBudgetView {
  return new WeightedBadgeBudgetView(
    item.code,
    item.title,
    String(item.limit),
    text.truncate(item.utmSource, 40),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBadgeBudgetViews(items: WeightedBadgeBudget[]): WeightedBadgeBudgetView[] {
  const views: WeightedBadgeBudgetView[] = [];
  for (const item of items) {
    views.push(toWeightedBadgeBudgetView(item));
  }
  return views;
}

export function sumWeightedBadgeBudgetView(view: WeightedBadgeBudgetView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedLimit;
}
