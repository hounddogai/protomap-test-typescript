import * as text from "../../../../kit/text.js";
import { BatchedCreditEntry } from "./batched-credit-entry.js";

/** How screens and exports show a batched credit entry. */
export class BatchedCreditEntryView {
  code: string;
  label: string;
  weight: string;
  attempts: string;
  currency: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    attempts: string,
    currency: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.attempts = attempts;
    this.currency = currency;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCreditEntryView(item: BatchedCreditEntry): BatchedCreditEntryView {
  return new BatchedCreditEntryView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    String(item.attempts),
    item.currency,
    text.truncate(item.name, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCreditEntryViews(items: BatchedCreditEntry[]): BatchedCreditEntryView[] {
  const views: BatchedCreditEntryView[] = [];
  for (const item of items) {
    views.push(toBatchedCreditEntryView(item));
  }
  return views;
}

export function sumBatchedCreditEntryView(view: BatchedCreditEntryView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedWeight + parsedAttempts;
}
