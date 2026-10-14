import * as text from "../../../../kit/text.js";
import { BatchedPaywallEntry } from "./batched-paywall-entry.js";

/** How screens and exports show a batched paywall entry. */
export class BatchedPaywallEntryView {
  codeText: string;
  nameText: string;
  minimum: string;
  active: string;
  batchSize: string;
  sourceText: string;
  reviewerText: string;
  attempts: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    minimum: string,
    active: string,
    batchSize: string,
    sourceText: string,
    reviewerText: string,
    attempts: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.minimum = minimum;
    this.active = active;
    this.batchSize = batchSize;
    this.sourceText = sourceText;
    this.reviewerText = reviewerText;
    this.attempts = attempts;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPaywallEntryView(item: BatchedPaywallEntry): BatchedPaywallEntryView {
  return new BatchedPaywallEntryView(
    item.code,
    text.truncate(item.name, 40),
    item.minimum.toFixed(2),
    `${item.active}`,
    String(item.batchSize),
    item.source,
    item.reviewer,
    String(item.attempts),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPaywallEntryViews(items: BatchedPaywallEntry[]): BatchedPaywallEntryView[] {
  const views: BatchedPaywallEntryView[] = [];
  for (const item of items) {
    views.push(toBatchedPaywallEntryView(item));
  }
  return views;
}

export function sumBatchedPaywallEntryView(view: BatchedPaywallEntryView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedMinimum + parsedBatchSize + parsedAttempts;
}
