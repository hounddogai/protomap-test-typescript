import * as text from "../../../../kit/text.js";
import { PendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

/** How screens and exports show a pending suppression checkpoint. */
export class PendingSuppressionCheckpointView {
  codeText: string;
  label: string;
  amountText: string;
  category: string;
  archived: string;
  externalRefText: string;
  approved: string;
  threshold: string;
  conversionRate: string;
  discount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    amountText: string,
    category: string,
    archived: string,
    externalRefText: string,
    approved: string,
    threshold: string,
    conversionRate: string,
    discount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.amountText = amountText;
    this.category = category;
    this.archived = archived;
    this.externalRefText = externalRefText;
    this.approved = approved;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSuppressionCheckpointView(item: PendingSuppressionCheckpoint): PendingSuppressionCheckpointView {
  return new PendingSuppressionCheckpointView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.amount.toFixed(2),
    text.truncate(item.category, 64),
    `${item.archived}`,
    item.externalRef,
    `${item.approved}`,
    item.threshold.toFixed(2),
    item.conversionRate.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSuppressionCheckpointViews(items: PendingSuppressionCheckpoint[]): PendingSuppressionCheckpointView[] {
  const views: PendingSuppressionCheckpointView[] = [];
  for (const item of items) {
    views.push(toPendingSuppressionCheckpointView(item));
  }
  return views;
}

export function sumPendingSuppressionCheckpointView(view: PendingSuppressionCheckpointView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAmount + parsedThreshold + parsedConversionRate;
}
