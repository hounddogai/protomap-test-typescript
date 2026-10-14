import * as text from "../../../../kit/text.js";
import { ScheduledQueueLedger } from "./scheduled-queue-ledger.js";

/** How screens and exports show a scheduled queue ledger. */
export class ScheduledQueueLedgerView {
  codeText: string;
  name: string;
  reviewer: string;
  notes: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    reviewer: string,
    notes: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.reviewer = reviewer;
    this.notes = notes;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledQueueLedgerView(item: ScheduledQueueLedger): ScheduledQueueLedgerView {
  return new ScheduledQueueLedgerView(
    item.code,
    text.truncate(item.name, 64),
    item.reviewer,
    item.notes,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledQueueLedgerViews(items: ScheduledQueueLedger[]): ScheduledQueueLedgerView[] {
  const views: ScheduledQueueLedgerView[] = [];
  for (const item of items) {
    views.push(toScheduledQueueLedgerView(item));
  }
  return views;
}

export function sumScheduledQueueLedgerView(view: ScheduledQueueLedgerView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
