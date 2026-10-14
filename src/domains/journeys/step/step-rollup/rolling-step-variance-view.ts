import * as text from "../../../../kit/text.js";
import { RollingStepVariance } from "./rolling-step-variance.js";

/** How screens and exports show a rolling step variance. */
export class RollingStepVarianceView {
  code: string;
  label: string;
  openRate: string;
  reviewerText: string;
  timezone: string;
  budgetText: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRate: string,
    reviewerText: string,
    timezone: string,
    budgetText: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.reviewerText = reviewerText;
    this.timezone = timezone;
    this.budgetText = budgetText;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toRollingStepVarianceView(item: RollingStepVariance): RollingStepVarianceView {
  return new RollingStepVarianceView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    item.openRate.toFixed(2),
    text.truncate(item.reviewer, 64),
    item.timezone,
    item.budget.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingStepVarianceViews(items: RollingStepVariance[]): RollingStepVarianceView[] {
  const views: RollingStepVarianceView[] = [];
  for (const item of items) {
    views.push(toRollingStepVarianceView(item));
  }
  return views;
}

export function sumRollingStepVarianceView(view: RollingStepVarianceView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedOpenRate + parsedBudget;
}
