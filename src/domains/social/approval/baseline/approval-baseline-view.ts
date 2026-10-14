import * as text from "../../../../kit/text.js";
import { ApprovalBaseline } from "./approval-baseline.js";

/** How screens and exports show a approval baseline. */
export class ApprovalBaselineView {
  codeText: string;
  name: string;
  openRate: string;
  budget: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    openRate: string,
    budget: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.openRate = openRate;
    this.budget = budget;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalBaselineView(item: ApprovalBaseline): ApprovalBaselineView {
  return new ApprovalBaselineView(
    text.truncate(item.code, 64),
    item.name,
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalBaselineViews(items: ApprovalBaseline[]): ApprovalBaselineView[] {
  const views: ApprovalBaselineView[] = [];
  for (const item of items) {
    views.push(toApprovalBaselineView(item));
  }
  return views;
}

export function sumApprovalBaselineView(view: ApprovalBaselineView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedOpenRate + parsedBudget;
}
