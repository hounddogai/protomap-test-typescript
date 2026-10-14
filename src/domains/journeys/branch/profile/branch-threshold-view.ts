import * as text from "../../../../kit/text.js";
import { BranchThreshold } from "./branch-threshold.js";

/** How screens and exports show a branch threshold. */
export class BranchThresholdView {
  code: string;
  title: string;
  approved: string;
  summaryText: string;
  visible: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approved: string,
    summaryText: string,
    visible: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.summaryText = summaryText;
    this.visible = visible;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toBranchThresholdView(item: BranchThreshold): BranchThresholdView {
  return new BranchThresholdView(
    item.code,
    text.truncate(item.title, 120),
    `${item.approved}`,
    text.truncate(item.summary, 120),
    `${item.visible}`,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchThresholdViews(items: BranchThreshold[]): BranchThresholdView[] {
  const views: BranchThresholdView[] = [];
  for (const item of items) {
    views.push(toBranchThresholdView(item));
  }
  return views;
}

export function sumBranchThresholdView(view: BranchThresholdView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
