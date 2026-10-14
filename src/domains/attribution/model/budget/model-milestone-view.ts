import { ModelMilestone } from "./model-milestone.js";

/** How screens and exports show a model milestone. */
export class ModelMilestoneView {
  code: string;
  name: string;
  categoryText: string;
  bid: string;
  locale: string;
  reviewerText: string;
  budgetText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    categoryText: string,
    bid: string,
    locale: string,
    reviewerText: string,
    budgetText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.categoryText = categoryText;
    this.bid = bid;
    this.locale = locale;
    this.reviewerText = reviewerText;
    this.budgetText = budgetText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toModelMilestoneView(item: ModelMilestone): ModelMilestoneView {
  return new ModelMilestoneView(
    item.code,
    item.name,
    item.category,
    item.bid.toFixed(2),
    item.locale,
    item.reviewer,
    item.budget.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelMilestoneViews(items: ModelMilestone[]): ModelMilestoneView[] {
  const views: ModelMilestoneView[] = [];
  for (const item of items) {
    views.push(toModelMilestoneView(item));
  }
  return views;
}

export function sumModelMilestoneView(view: ModelMilestoneView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBid + parsedBudget;
}
