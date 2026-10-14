import * as text from "../../../../kit/text.js";
import { PrimaryModelPlan } from "./primary-model-plan.js";

/** How screens and exports show a primary model plan. */
export class PrimaryModelPlanView {
  code: string;
  label: string;
  category: string;
  description: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    description: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.description = description;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryModelPlanView(item: PrimaryModelPlan): PrimaryModelPlanView {
  return new PrimaryModelPlanView(
    item.code,
    text.truncate(item.label, 64),
    item.category,
    item.description,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryModelPlanViews(items: PrimaryModelPlan[]): PrimaryModelPlanView[] {
  const views: PrimaryModelPlanView[] = [];
  for (const item of items) {
    views.push(toPrimaryModelPlanView(item));
  }
  return views;
}

export function sumPrimaryModelPlanView(view: PrimaryModelPlanView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
