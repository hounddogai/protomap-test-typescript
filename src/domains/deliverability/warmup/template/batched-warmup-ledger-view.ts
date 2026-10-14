import * as text from "../../../../kit/text.js";
import { BatchedWarmupLedger } from "./batched-warmup-ledger.js";

/** How screens and exports show a batched warmup ledger. */
export class BatchedWarmupLedgerView {
  codeText: string;
  titleText: string;
  threshold: string;
  cohort: string;
  batchSizeText: string;
  createdAtText: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    threshold: string,
    cohort: string,
    batchSizeText: string,
    createdAtText: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.threshold = threshold;
    this.cohort = cohort;
    this.batchSizeText = batchSizeText;
    this.createdAtText = createdAtText;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWarmupLedgerView(item: BatchedWarmupLedger): BatchedWarmupLedgerView {
  return new BatchedWarmupLedgerView(
    item.code,
    text.truncate(item.title, 64),
    item.threshold.toFixed(2),
    item.cohort,
    String(item.batchSize),
    String(item.createdAt),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWarmupLedgerViews(items: BatchedWarmupLedger[]): BatchedWarmupLedgerView[] {
  const views: BatchedWarmupLedgerView[] = [];
  for (const item of items) {
    views.push(toBatchedWarmupLedgerView(item));
  }
  return views;
}

export function sumBatchedWarmupLedgerView(view: BatchedWarmupLedgerView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedThreshold + parsedBatchSize + parsedCreatedAt;
}
