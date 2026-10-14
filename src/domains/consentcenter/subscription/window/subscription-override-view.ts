import * as text from "../../../../kit/text.js";
import { SubscriptionOverride } from "./subscription-override.js";

/** How screens and exports show a subscription override. */
export class SubscriptionOverrideView {
  code: string;
  name: string;
  rate: string;
  budgetText: string;
  margin: string;
  journeyIdText: string;
  floorValue: string;
  maximum: string;
  reviewer: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    budgetText: string,
    margin: string,
    journeyIdText: string,
    floorValue: string,
    maximum: string,
    reviewer: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budgetText = budgetText;
    this.margin = margin;
    this.journeyIdText = journeyIdText;
    this.floorValue = floorValue;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionOverrideView(item: SubscriptionOverride): SubscriptionOverrideView {
  return new SubscriptionOverrideView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    text.truncate(item.journeyId, 64),
    item.floorValue.toFixed(2),
    item.maximum.toFixed(2),
    item.reviewer,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionOverrideViews(items: SubscriptionOverride[]): SubscriptionOverrideView[] {
  const views: SubscriptionOverrideView[] = [];
  for (const item of items) {
    views.push(toSubscriptionOverrideView(item));
  }
  return views;
}

export function sumSubscriptionOverrideView(view: SubscriptionOverrideView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRate + parsedBudget + parsedMargin;
}
