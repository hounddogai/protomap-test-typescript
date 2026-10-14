import * as text from "../../../../kit/text.js";
import { PendingModelRequest } from "./pending-model-request.js";

/** How screens and exports show a pending model request. */
export class PendingModelRequestView {
  codeText: string;
  titleText: string;
  archived: string;
  batchSizeText: string;
  budget: string;
  attempts: string;
  quantityText: string;
  weight: string;
  margin: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    archived: string,
    batchSizeText: string,
    budget: string,
    attempts: string,
    quantityText: string,
    weight: string,
    margin: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.archived = archived;
    this.batchSizeText = batchSizeText;
    this.budget = budget;
    this.attempts = attempts;
    this.quantityText = quantityText;
    this.weight = weight;
    this.margin = margin;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toPendingModelRequestView(item: PendingModelRequest): PendingModelRequestView {
  return new PendingModelRequestView(
    item.code,
    text.truncate(item.title, 64),
    `${item.archived}`,
    String(item.batchSize),
    item.budget.toFixed(2),
    String(item.attempts),
    String(item.quantity),
    item.weight.toFixed(2),
    item.margin.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingModelRequestViews(items: PendingModelRequest[]): PendingModelRequestView[] {
  const views: PendingModelRequestView[] = [];
  for (const item of items) {
    views.push(toPendingModelRequestView(item));
  }
  return views;
}

export function sumPendingModelRequestView(view: PendingModelRequestView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBatchSize + parsedBudget + parsedAttempts;
}
