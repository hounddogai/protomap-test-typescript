import * as text from "../../../../kit/text.js";
import { ReputationBatch } from "./reputation-batch.js";

/** How screens and exports show a reputation batch. */
export class ReputationBatchView {
  codeText: string;
  nameText: string;
  approved: string;
  externalRefText: string;
  summary: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    approved: string,
    externalRefText: string,
    summary: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.approved = approved;
    this.externalRefText = externalRefText;
    this.summary = summary;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toReputationBatchView(item: ReputationBatch): ReputationBatchView {
  return new ReputationBatchView(
    item.code,
    item.name,
    `${item.approved}`,
    text.truncate(item.externalRef, 120),
    item.summary,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationBatchViews(items: ReputationBatch[]): ReputationBatchView[] {
  const views: ReputationBatchView[] = [];
  for (const item of items) {
    views.push(toReputationBatchView(item));
  }
  return views;
}

export function sumReputationBatchView(view: ReputationBatchView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
