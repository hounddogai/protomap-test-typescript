import * as text from "../../../../kit/text.js";
import { StepBudget } from "./step-budget.js";

/** How screens and exports show a step budget. */
export class StepBudgetView {
  code: string;
  label: string;
  limit: string;
  ceiling: string;
  ratio: string;
  unit: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    limit: string,
    ceiling: string,
    ratio: string,
    unit: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.unit = unit;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toStepBudgetView(item: StepBudget): StepBudgetView {
  return new StepBudgetView(
    item.code,
    text.truncate(item.label, 80),
    String(item.limit),
    item.ceiling.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.unit, 40),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStepBudgetViews(items: StepBudget[]): StepBudgetView[] {
  const views: StepBudgetView[] = [];
  for (const item of items) {
    views.push(toStepBudgetView(item));
  }
  return views;
}

export function sumStepBudgetView(view: StepBudgetView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedLimit + parsedCeiling + parsedRatio;
}
