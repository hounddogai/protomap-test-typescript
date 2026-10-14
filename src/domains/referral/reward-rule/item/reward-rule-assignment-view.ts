import * as text from "../../../../kit/text.js";
import { RewardRuleAssignment } from "./reward-rule-assignment.js";

/** How screens and exports show a reward rule assignment. */
export class RewardRuleAssignmentView {
  code: string;
  title: string;
  maximum: string;
  limit: string;
  budgetText: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    maximum: string,
    limit: string,
    budgetText: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.limit = limit;
    this.budgetText = budgetText;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleAssignmentView(item: RewardRuleAssignment): RewardRuleAssignmentView {
  return new RewardRuleAssignmentView(
    item.code,
    text.truncate(item.title, 64),
    item.maximum.toFixed(2),
    String(item.limit),
    item.budget.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleAssignmentViews(items: RewardRuleAssignment[]): RewardRuleAssignmentView[] {
  const views: RewardRuleAssignmentView[] = [];
  for (const item of items) {
    views.push(toRewardRuleAssignmentView(item));
  }
  return views;
}

export function sumRewardRuleAssignmentView(view: RewardRuleAssignmentView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedMaximum + parsedLimit + parsedBudget;
}
