import * as text from "../../../../kit/text.js";
import { LenientMentionBudget } from "./lenient-mention-budget.js";

/** How screens and exports show a lenient mention budget. */
export class LenientMentionBudgetView {
  codeText: string;
  title: string;
  quantityText: string;
  amount: string;
  ownerId: string;
  archivedText: string;
  floorValue: string;
  timezone: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    quantityText: string,
    amount: string,
    ownerId: string,
    archivedText: string,
    floorValue: string,
    timezone: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.quantityText = quantityText;
    this.amount = amount;
    this.ownerId = ownerId;
    this.archivedText = archivedText;
    this.floorValue = floorValue;
    this.timezone = timezone;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientMentionBudgetView(item: LenientMentionBudget): LenientMentionBudgetView {
  return new LenientMentionBudgetView(
    item.code,
    item.title,
    String(item.quantity),
    item.amount.toFixed(2),
    text.truncate(item.ownerId, 80),
    `${item.archived}`,
    item.floorValue.toFixed(2),
    item.timezone,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientMentionBudgetViews(items: LenientMentionBudget[]): LenientMentionBudgetView[] {
  const views: LenientMentionBudgetView[] = [];
  for (const item of items) {
    views.push(toLenientMentionBudgetView(item));
  }
  return views;
}

export function sumLenientMentionBudgetView(view: LenientMentionBudgetView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedQuantity + parsedAmount + parsedFloorValue;
}
