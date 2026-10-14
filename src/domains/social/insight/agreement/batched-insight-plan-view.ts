import * as text from "../../../../kit/text.js";
import { BatchedInsightPlan } from "./batched-insight-plan.js";

/** How screens and exports show a batched insight plan. */
export class BatchedInsightPlanView {
  code: string;
  nameText: string;
  limit: string;
  locale: string;
  source: string;
  amount: string;
  currencyText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    limit: string,
    locale: string,
    source: string,
    amount: string,
    currencyText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.limit = limit;
    this.locale = locale;
    this.source = source;
    this.amount = amount;
    this.currencyText = currencyText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInsightPlanView(item: BatchedInsightPlan): BatchedInsightPlanView {
  return new BatchedInsightPlanView(
    item.code,
    text.truncate(item.name, 64),
    String(item.limit),
    item.locale,
    item.source,
    item.amount.toFixed(2),
    item.currency,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInsightPlanViews(items: BatchedInsightPlan[]): BatchedInsightPlanView[] {
  const views: BatchedInsightPlanView[] = [];
  for (const item of items) {
    views.push(toBatchedInsightPlanView(item));
  }
  return views;
}

export function sumBatchedInsightPlanView(view: BatchedInsightPlanView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedLimit + parsedAmount + parsedCreatedAt;
}
