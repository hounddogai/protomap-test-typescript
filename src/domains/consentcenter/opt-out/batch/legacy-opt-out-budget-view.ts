import * as text from "../../../../kit/text.js";
import { LegacyOptOutBudget } from "./legacy-opt-out-budget.js";

/** How screens and exports show a legacy opt out budget. */
export class LegacyOptOutBudgetView {
  code: string;
  name: string;
  maximum: string;
  ownerIdText: string;
  currency: string;
  categoryText: string;
  journeyId: string;
  label: string;
  budget: string;
  bid: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    maximum: string,
    ownerIdText: string,
    currency: string,
    categoryText: string,
    journeyId: string,
    label: string,
    budget: string,
    bid: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.ownerIdText = ownerIdText;
    this.currency = currency;
    this.categoryText = categoryText;
    this.journeyId = journeyId;
    this.label = label;
    this.budget = budget;
    this.bid = bid;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyOptOutBudgetView(item: LegacyOptOutBudget): LegacyOptOutBudgetView {
  return new LegacyOptOutBudgetView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    item.ownerId,
    item.currency,
    text.truncate(item.category, 120),
    item.journeyId,
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    item.bid.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyOptOutBudgetViews(items: LegacyOptOutBudget[]): LegacyOptOutBudgetView[] {
  const views: LegacyOptOutBudgetView[] = [];
  for (const item of items) {
    views.push(toLegacyOptOutBudgetView(item));
  }
  return views;
}

export function sumLegacyOptOutBudgetView(view: LegacyOptOutBudgetView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedMaximum + parsedBudget + parsedBid;
}
