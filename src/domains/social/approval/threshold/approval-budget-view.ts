import * as text from "../../../../kit/text.js";
import { ApprovalBudget } from "./approval-budget.js";

/** How screens and exports show a approval budget. */
export class ApprovalBudgetView {
  code: string;
  label: string;
  sourceText: string;
  expiresAt: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sourceText: string,
    expiresAt: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sourceText = sourceText;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalBudgetView(item: ApprovalBudget): ApprovalBudgetView {
  return new ApprovalBudgetView(
    text.truncate(item.code, 64),
    item.label,
    item.source,
    String(item.expiresAt),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalBudgetViews(items: ApprovalBudget[]): ApprovalBudgetView[] {
  const views: ApprovalBudgetView[] = [];
  for (const item of items) {
    views.push(toApprovalBudgetView(item));
  }
  return views;
}

export function sumApprovalBudgetView(view: ApprovalBudgetView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedExpiresAt + parsedPriority;
}
