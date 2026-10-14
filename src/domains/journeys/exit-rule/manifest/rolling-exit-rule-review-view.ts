import { RollingExitRuleReview } from "./rolling-exit-rule-review.js";

/** How screens and exports show a rolling exit rule review. */
export class RollingExitRuleReviewView {
  code: string;
  label: string;
  campaignRef: string;
  budgetText: string;
  amount: string;
  sendAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budgetText: string,
    amount: string,
    sendAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budgetText = budgetText;
    this.amount = amount;
    this.sendAt = sendAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toRollingExitRuleReviewView(item: RollingExitRuleReview): RollingExitRuleReviewView {
  return new RollingExitRuleReviewView(
    item.code,
    item.label,
    item.campaignRef,
    item.budget.toFixed(2),
    item.amount.toFixed(2),
    String(item.sendAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingExitRuleReviewViews(items: RollingExitRuleReview[]): RollingExitRuleReviewView[] {
  const views: RollingExitRuleReviewView[] = [];
  for (const item of items) {
    views.push(toRollingExitRuleReviewView(item));
  }
  return views;
}

export function sumRollingExitRuleReviewView(view: RollingExitRuleReviewView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBudget + parsedAmount + parsedSendAt;
}
