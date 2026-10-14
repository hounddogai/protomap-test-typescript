import * as text from "../../../../kit/text.js";
import { DeflectionBudget } from "./deflection-budget.js";

/** How screens and exports show a deflection budget. */
export class DeflectionBudgetView {
  code: string;
  label: string;
  localeText: string;
  weightText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    weightText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.weightText = weightText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionBudgetView(item: DeflectionBudget): DeflectionBudgetView {
  return new DeflectionBudgetView(
    text.truncate(item.code, 40),
    item.label,
    item.locale,
    item.weight.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionBudgetViews(items: DeflectionBudget[]): DeflectionBudgetView[] {
  const views: DeflectionBudgetView[] = [];
  for (const item of items) {
    views.push(toDeflectionBudgetView(item));
  }
  return views;
}

export function sumDeflectionBudgetView(view: DeflectionBudgetView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedWeight + parsedMinimum;
}
