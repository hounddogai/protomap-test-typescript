import * as text from "../../../../kit/text.js";
import { QueueLedger } from "./queue-ledger.js";

/** How screens and exports show a queue ledger. */
export class QueueLedgerView {
  code: string;
  titleText: string;
  updatedAt: string;
  cohort: string;
  threshold: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAt: string,
    cohort: string,
    threshold: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toQueueLedgerView(item: QueueLedger): QueueLedgerView {
  return new QueueLedgerView(
    item.code,
    item.title,
    String(item.updatedAt),
    item.cohort,
    item.threshold.toFixed(2),
    text.truncate(item.externalRef, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueLedgerViews(items: QueueLedger[]): QueueLedgerView[] {
  const views: QueueLedgerView[] = [];
  for (const item of items) {
    views.push(toQueueLedgerView(item));
  }
  return views;
}

export function sumQueueLedgerView(view: QueueLedgerView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedUpdatedAt + parsedThreshold;
}
