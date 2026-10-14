import * as text from "../../../../kit/text.js";
import { CappedRewardRuleAssignment } from "./capped-reward-rule-assignment.js";

/** How screens and exports show a capped reward rule assignment. */
export class CappedRewardRuleAssignmentView {
  code: string;
  label: string;
  maximum: string;
  budget: string;
  journeyIdText: string;
  quantity: string;
  cost: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    maximum: string,
    budget: string,
    journeyIdText: string,
    quantity: string,
    cost: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.budget = budget;
    this.journeyIdText = journeyIdText;
    this.quantity = quantity;
    this.cost = cost;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toCappedRewardRuleAssignmentView(item: CappedRewardRuleAssignment): CappedRewardRuleAssignmentView {
  return new CappedRewardRuleAssignmentView(
    text.truncate(item.code, 40),
    item.label,
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    item.journeyId,
    String(item.quantity),
    item.cost.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedRewardRuleAssignmentViews(items: CappedRewardRuleAssignment[]): CappedRewardRuleAssignmentView[] {
  const views: CappedRewardRuleAssignmentView[] = [];
  for (const item of items) {
    views.push(toCappedRewardRuleAssignmentView(item));
  }
  return views;
}

export function sumCappedRewardRuleAssignmentView(view: CappedRewardRuleAssignmentView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMaximum + parsedBudget + parsedQuantity;
}
