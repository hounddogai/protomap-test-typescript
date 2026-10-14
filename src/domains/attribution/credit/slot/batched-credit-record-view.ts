import * as text from "../../../../kit/text.js";
import { BatchedCreditRecord } from "./batched-credit-record.js";

/** How screens and exports show a batched credit record. */
export class BatchedCreditRecordView {
  code: string;
  title: string;
  discount: string;
  reviewer: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    discount: string,
    reviewer: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.reviewer = reviewer;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCreditRecordView(item: BatchedCreditRecord): BatchedCreditRecordView {
  return new BatchedCreditRecordView(
    text.truncate(item.code, 80),
    item.title,
    item.discount.toFixed(2),
    item.reviewer,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCreditRecordViews(items: BatchedCreditRecord[]): BatchedCreditRecordView[] {
  const views: BatchedCreditRecordView[] = [];
  for (const item of items) {
    views.push(toBatchedCreditRecordView(item));
  }
  return views;
}

export function sumBatchedCreditRecordView(view: BatchedCreditRecordView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedDiscount + parsedBudget;
}
