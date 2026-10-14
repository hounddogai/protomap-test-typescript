import { PathPlan } from "./path-plan.js";

/** How screens and exports show a path plan. */
export class PathPlanView {
  codeText: string;
  titleText: string;
  budgetText: string;
  updatedAt: string;
  rate: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    budgetText: string,
    updatedAt: string,
    rate: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.budgetText = budgetText;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toPathPlanView(item: PathPlan): PathPlanView {
  return new PathPlanView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    String(item.updatedAt),
    item.rate.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathPlanViews(items: PathPlan[]): PathPlanView[] {
  const views: PathPlanView[] = [];
  for (const item of items) {
    views.push(toPathPlanView(item));
  }
  return views;
}

export function sumPathPlanView(view: PathPlanView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBudget + parsedUpdatedAt + parsedRate;
}
