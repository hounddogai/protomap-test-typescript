import * as text from "../../../../kit/text.js";
import { SuppressionCycle } from "./suppression-cycle.js";

/** How screens and exports show a suppression cycle. */
export class SuppressionCycleView {
  code: string;
  name: string;
  budget: string;
  locale: string;
  rateText: string;
  statusLabel: string;

  constructor(code: string, name: string, budget: string, locale: string, rateText: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.locale = locale;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionCycleView(item: SuppressionCycle): SuppressionCycleView {
  return new SuppressionCycleView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    text.truncate(item.locale, 40),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionCycleViews(items: SuppressionCycle[]): SuppressionCycleView[] {
  const views: SuppressionCycleView[] = [];
  for (const item of items) {
    views.push(toSuppressionCycleView(item));
  }
  return views;
}

export function sumSuppressionCycleView(view: SuppressionCycleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedBudget + parsedRate;
}
