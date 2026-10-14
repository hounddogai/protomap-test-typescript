import * as text from "../../../../kit/text.js";
import { SuppressionClaim } from "./suppression-claim.js";

/** How screens and exports show a suppression claim. */
export class SuppressionClaimView {
  code: string;
  label: string;
  amount: string;
  regionText: string;
  notes: string;
  channel: string;
  createdAt: string;
  visible: string;
  batchSize: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    regionText: string,
    notes: string,
    channel: string,
    createdAt: string,
    visible: string,
    batchSize: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.regionText = regionText;
    this.notes = notes;
    this.channel = channel;
    this.createdAt = createdAt;
    this.visible = visible;
    this.batchSize = batchSize;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionClaimView(item: SuppressionClaim): SuppressionClaimView {
  return new SuppressionClaimView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 80),
    item.amount.toFixed(2),
    text.truncate(item.region, 80),
    text.truncate(item.notes, 120),
    text.truncate(item.channel, 64),
    String(item.createdAt),
    `${item.visible}`,
    String(item.batchSize),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionClaimViews(items: SuppressionClaim[]): SuppressionClaimView[] {
  const views: SuppressionClaimView[] = [];
  for (const item of items) {
    views.push(toSuppressionClaimView(item));
  }
  return views;
}

export function sumSuppressionClaimView(view: SuppressionClaimView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedAmount + parsedCreatedAt + parsedBatchSize;
}
