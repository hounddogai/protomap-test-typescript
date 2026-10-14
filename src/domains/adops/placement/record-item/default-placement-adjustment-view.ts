import * as text from "../../../../kit/text.js";
import { DefaultPlacementAdjustment } from "./default-placement-adjustment.js";

/** How screens and exports show a default placement adjustment. */
export class DefaultPlacementAdjustmentView {
  codeText: string;
  labelText: string;
  categoryText: string;
  journeyIdText: string;
  bid: string;
  archivedText: string;
  budget: string;
  externalRef: string;
  amount: string;
  frequencyCap: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    categoryText: string,
    journeyIdText: string,
    bid: string,
    archivedText: string,
    budget: string,
    externalRef: string,
    amount: string,
    frequencyCap: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.categoryText = categoryText;
    this.journeyIdText = journeyIdText;
    this.bid = bid;
    this.archivedText = archivedText;
    this.budget = budget;
    this.externalRef = externalRef;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPlacementAdjustmentView(item: DefaultPlacementAdjustment): DefaultPlacementAdjustmentView {
  return new DefaultPlacementAdjustmentView(
    item.code,
    item.label,
    text.truncate(item.category, 40),
    text.truncate(item.journeyId, 80),
    item.bid.toFixed(2),
    `${item.archived}`,
    item.budget.toFixed(2),
    text.truncate(item.externalRef, 40),
    item.amount.toFixed(2),
    String(item.frequencyCap),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPlacementAdjustmentViews(items: DefaultPlacementAdjustment[]): DefaultPlacementAdjustmentView[] {
  const views: DefaultPlacementAdjustmentView[] = [];
  for (const item of items) {
    views.push(toDefaultPlacementAdjustmentView(item));
  }
  return views;
}

export function sumDefaultPlacementAdjustmentView(view: DefaultPlacementAdjustmentView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedBid + parsedBudget + parsedAmount;
}
