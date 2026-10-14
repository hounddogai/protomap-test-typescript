import * as text from "../../../../kit/text.js";
import { PrimaryPathSlot } from "./primary-path-slot.js";

/** How screens and exports show a primary path slot. */
export class PrimaryPathSlotView {
  code: string;
  name: string;
  budget: string;
  quantity: string;
  amount: string;
  activeText: string;
  cohort: string;
  weight: string;
  score: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    quantity: string,
    amount: string,
    activeText: string,
    cohort: string,
    weight: string,
    score: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.quantity = quantity;
    this.amount = amount;
    this.activeText = activeText;
    this.cohort = cohort;
    this.weight = weight;
    this.score = score;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPathSlotView(item: PrimaryPathSlot): PrimaryPathSlotView {
  return new PrimaryPathSlotView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    item.budget.toFixed(2),
    String(item.quantity),
    item.amount.toFixed(2),
    `${item.active}`,
    item.cohort,
    item.weight.toFixed(2),
    item.score.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPathSlotViews(items: PrimaryPathSlot[]): PrimaryPathSlotView[] {
  const views: PrimaryPathSlotView[] = [];
  for (const item of items) {
    views.push(toPrimaryPathSlotView(item));
  }
  return views;
}

export function sumPrimaryPathSlotView(view: PrimaryPathSlotView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedBudget + parsedQuantity + parsedAmount;
}
