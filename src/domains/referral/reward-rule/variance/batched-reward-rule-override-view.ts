import * as text from "../../../../kit/text.js";
import { BatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

/** How screens and exports show a batched reward rule override. */
export class BatchedRewardRuleOverrideView {
  code: string;
  name: string;
  openRate: string;
  phoneText: string;
  budget: string;
  summaryText: string;
  retriesText: string;
  category: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    phoneText: string,
    budget: string,
    summaryText: string,
    retriesText: string,
    category: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.phoneText = phoneText;
    this.budget = budget;
    this.summaryText = summaryText;
    this.retriesText = retriesText;
    this.category = category;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedRewardRuleOverrideView(item: BatchedRewardRuleOverride): BatchedRewardRuleOverrideView {
  return new BatchedRewardRuleOverrideView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    item.phone,
    item.budget.toFixed(2),
    item.summary,
    String(item.retries),
    text.truncate(item.category, 80),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedRewardRuleOverrideViews(items: BatchedRewardRuleOverride[]): BatchedRewardRuleOverrideView[] {
  const views: BatchedRewardRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toBatchedRewardRuleOverrideView(item));
  }
  return views;
}

export function sumBatchedRewardRuleOverrideView(view: BatchedRewardRuleOverrideView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedOpenRate + parsedBudget + parsedRetries;
}
