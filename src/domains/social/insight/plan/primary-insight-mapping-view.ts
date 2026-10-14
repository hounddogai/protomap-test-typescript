import * as text from "../../../../kit/text.js";
import { PrimaryInsightMapping } from "./primary-insight-mapping.js";

/** How screens and exports show a primary insight mapping. */
export class PrimaryInsightMappingView {
  code: string;
  name: string;
  limit: string;
  amountText: string;
  budget: string;
  quantity: string;
  priorityText: string;
  active: string;
  utmSource: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    amountText: string,
    budget: string,
    quantity: string,
    priorityText: string,
    active: string,
    utmSource: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.amountText = amountText;
    this.budget = budget;
    this.quantity = quantity;
    this.priorityText = priorityText;
    this.active = active;
    this.utmSource = utmSource;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInsightMappingView(item: PrimaryInsightMapping): PrimaryInsightMappingView {
  return new PrimaryInsightMappingView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 64),
    String(item.limit),
    item.amount.toFixed(2),
    item.budget.toFixed(2),
    String(item.quantity),
    String(item.priority),
    `${item.active}`,
    item.utmSource,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInsightMappingViews(items: PrimaryInsightMapping[]): PrimaryInsightMappingView[] {
  const views: PrimaryInsightMappingView[] = [];
  for (const item of items) {
    views.push(toPrimaryInsightMappingView(item));
  }
  return views;
}

export function sumPrimaryInsightMappingView(view: PrimaryInsightMappingView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedLimit + parsedAmount + parsedBudget;
}
