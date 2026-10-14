import { BatchedConversionRecord } from "./batched-conversion-record.js";

/** How screens and exports show a batched conversion record. */
export class BatchedConversionRecordView {
  code: string;
  label: string;
  version: string;
  ratio: string;
  expiresAt: string;
  maximum: string;
  journeyIdText: string;
  amount: string;
  limit: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    ratio: string,
    expiresAt: string,
    maximum: string,
    journeyIdText: string,
    amount: string,
    limit: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
    this.journeyIdText = journeyIdText;
    this.amount = amount;
    this.limit = limit;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedConversionRecordView(item: BatchedConversionRecord): BatchedConversionRecordView {
  return new BatchedConversionRecordView(
    item.code,
    item.label,
    String(item.version),
    item.ratio.toFixed(2),
    String(item.expiresAt),
    item.maximum.toFixed(2),
    item.journeyId,
    item.amount.toFixed(2),
    String(item.limit),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedConversionRecordViews(items: BatchedConversionRecord[]): BatchedConversionRecordView[] {
  const views: BatchedConversionRecordView[] = [];
  for (const item of items) {
    views.push(toBatchedConversionRecordView(item));
  }
  return views;
}

export function sumBatchedConversionRecordView(view: BatchedConversionRecordView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedVersion + parsedRatio + parsedExpiresAt;
}
