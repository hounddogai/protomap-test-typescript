import { AdaptiveCreditBudget } from "./adaptive-credit-budget.js";

/** How screens and exports show a adaptive credit budget. */
export class AdaptiveCreditBudgetView {
  codeText: string;
  titleText: string;
  cost: string;
  ownerId: string;
  description: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    cost: string,
    ownerId: string,
    description: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.cost = cost;
    this.ownerId = ownerId;
    this.description = description;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCreditBudgetView(item: AdaptiveCreditBudget): AdaptiveCreditBudgetView {
  return new AdaptiveCreditBudgetView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    item.ownerId,
    item.description,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCreditBudgetViews(items: AdaptiveCreditBudget[]): AdaptiveCreditBudgetView[] {
  const views: AdaptiveCreditBudgetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCreditBudgetView(item));
  }
  return views;
}

export function sumAdaptiveCreditBudgetView(view: AdaptiveCreditBudgetView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
