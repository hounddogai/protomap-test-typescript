import * as text from "../../../../kit/text.js";
import { CappedBidRuleReview } from "./capped-bid-rule-review.js";

/** How screens and exports show a capped bid rule review. */
export class CappedBidRuleReviewView {
  codeText: string;
  title: string;
  variant: string;
  maximumText: string;
  notes: string;
  quantity: string;
  amount: string;
  batchSize: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    variant: string,
    maximumText: string,
    notes: string,
    quantity: string,
    amount: string,
    batchSize: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.variant = variant;
    this.maximumText = maximumText;
    this.notes = notes;
    this.quantity = quantity;
    this.amount = amount;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBidRuleReviewView(item: CappedBidRuleReview): CappedBidRuleReviewView {
  return new CappedBidRuleReviewView(
    item.code,
    text.truncate(item.title, 120),
    item.variant,
    item.maximum.toFixed(2),
    item.notes,
    String(item.quantity),
    item.amount.toFixed(2),
    String(item.batchSize),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBidRuleReviewViews(items: CappedBidRuleReview[]): CappedBidRuleReviewView[] {
  const views: CappedBidRuleReviewView[] = [];
  for (const item of items) {
    views.push(toCappedBidRuleReviewView(item));
  }
  return views;
}

export function sumCappedBidRuleReviewView(view: CappedBidRuleReviewView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedMaximum + parsedQuantity + parsedAmount;
}
