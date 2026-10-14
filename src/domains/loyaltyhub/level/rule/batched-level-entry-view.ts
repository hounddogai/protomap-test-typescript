import { BatchedLevelEntry } from "./batched-level-entry.js";

/** How screens and exports show a batched level entry. */
export class BatchedLevelEntryView {
  code: string;
  name: string;
  expiresAt: string;
  description: string;
  locale: string;
  createdAtText: string;
  batchSize: string;
  variantText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    description: string,
    locale: string,
    createdAtText: string,
    batchSize: string,
    variantText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.description = description;
    this.locale = locale;
    this.createdAtText = createdAtText;
    this.batchSize = batchSize;
    this.variantText = variantText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedLevelEntryView(item: BatchedLevelEntry): BatchedLevelEntryView {
  return new BatchedLevelEntryView(
    item.code,
    item.name,
    String(item.expiresAt),
    item.description,
    item.locale,
    String(item.createdAt),
    String(item.batchSize),
    item.variant,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedLevelEntryViews(items: BatchedLevelEntry[]): BatchedLevelEntryView[] {
  const views: BatchedLevelEntryView[] = [];
  for (const item of items) {
    views.push(toBatchedLevelEntryView(item));
  }
  return views;
}

export function sumBatchedLevelEntryView(view: BatchedLevelEntryView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedExpiresAt + parsedCreatedAt + parsedBatchSize;
}
