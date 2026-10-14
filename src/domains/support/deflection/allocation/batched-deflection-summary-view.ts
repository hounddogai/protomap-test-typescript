import * as text from "../../../../kit/text.js";
import { BatchedDeflectionSummary } from "./batched-deflection-summary.js";

/** How screens and exports show a batched deflection summary. */
export class BatchedDeflectionSummaryView {
  code: string;
  title: string;
  rate: string;
  contactEmailText: string;
  amount: string;
  createdAt: string;
  nameText: string;
  active: string;
  segment: string;
  variant: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    rate: string,
    contactEmailText: string,
    amount: string,
    createdAt: string,
    nameText: string,
    active: string,
    segment: string,
    variant: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.contactEmailText = contactEmailText;
    this.amount = amount;
    this.createdAt = createdAt;
    this.nameText = nameText;
    this.active = active;
    this.segment = segment;
    this.variant = variant;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedDeflectionSummaryView(item: BatchedDeflectionSummary): BatchedDeflectionSummaryView {
  return new BatchedDeflectionSummaryView(
    item.code,
    text.truncate(item.title, 64),
    item.rate.toFixed(2),
    item.contactEmail,
    item.amount.toFixed(2),
    String(item.createdAt),
    item.name,
    `${item.active}`,
    text.truncate(item.segment, 80),
    item.variant,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedDeflectionSummaryViews(items: BatchedDeflectionSummary[]): BatchedDeflectionSummaryView[] {
  const views: BatchedDeflectionSummaryView[] = [];
  for (const item of items) {
    views.push(toBatchedDeflectionSummaryView(item));
  }
  return views;
}

export function sumBatchedDeflectionSummaryView(view: BatchedDeflectionSummaryView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRate + parsedAmount + parsedCreatedAt;
}
