import * as text from "../../../../kit/text.js";
import { BranchBudget } from "./branch-budget.js";

/** How screens and exports show a branch budget. */
export class BranchBudgetView {
  codeText: string;
  label: string;
  campaignRef: string;
  reviewerText: string;
  variant: string;
  externalRefText: string;
  limit: string;
  clicksText: string;
  createdAt: string;
  unitText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    campaignRef: string,
    reviewerText: string,
    variant: string,
    externalRefText: string,
    limit: string,
    clicksText: string,
    createdAt: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.campaignRef = campaignRef;
    this.reviewerText = reviewerText;
    this.variant = variant;
    this.externalRefText = externalRefText;
    this.limit = limit;
    this.clicksText = clicksText;
    this.createdAt = createdAt;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchBudgetView(item: BranchBudget): BranchBudgetView {
  return new BranchBudgetView(
    text.truncate(item.code, 40),
    item.label,
    item.campaignRef,
    item.reviewer,
    item.variant,
    item.externalRef,
    String(item.limit),
    String(item.clicks),
    String(item.createdAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchBudgetViews(items: BranchBudget[]): BranchBudgetView[] {
  const views: BranchBudgetView[] = [];
  for (const item of items) {
    views.push(toBranchBudgetView(item));
  }
  return views;
}

export function sumBranchBudgetView(view: BranchBudgetView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedLimit + parsedClicks + parsedCreatedAt;
}
