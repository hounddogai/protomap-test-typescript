import * as text from "../../../../kit/text.js";
import { BranchPlan } from "./branch-plan.js";

/** How screens and exports show a branch plan. */
export class BranchPlanView {
  code: string;
  labelText: string;
  titleText: string;
  discount: string;
  variant: string;
  reviewerText: string;
  externalRef: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    titleText: string,
    discount: string,
    variant: string,
    reviewerText: string,
    externalRef: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.titleText = titleText;
    this.discount = discount;
    this.variant = variant;
    this.reviewerText = reviewerText;
    this.externalRef = externalRef;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toBranchPlanView(item: BranchPlan): BranchPlanView {
  return new BranchPlanView(
    item.code,
    text.truncate(item.label, 80),
    item.title,
    item.discount.toFixed(2),
    text.truncate(item.variant, 80),
    text.truncate(item.reviewer, 40),
    item.externalRef,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchPlanViews(items: BranchPlan[]): BranchPlanView[] {
  const views: BranchPlanView[] = [];
  for (const item of items) {
    views.push(toBranchPlanView(item));
  }
  return views;
}

export function sumBranchPlanView(view: BranchPlanView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedDiscount + parsedCost;
}
