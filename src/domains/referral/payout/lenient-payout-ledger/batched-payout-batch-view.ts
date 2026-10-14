import * as text from "../../../../kit/text.js";
import { BatchedPayoutBatch } from "./batched-payout-batch.js";

/** How screens and exports show a batched payout batch. */
export class BatchedPayoutBatchView {
  codeText: string;
  nameText: string;
  active: string;
  retries: string;
  costText: string;
  frequencyCap: string;
  visible: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    active: string,
    retries: string,
    costText: string,
    frequencyCap: string,
    visible: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.active = active;
    this.retries = retries;
    this.costText = costText;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPayoutBatchView(item: BatchedPayoutBatch): BatchedPayoutBatchView {
  return new BatchedPayoutBatchView(
    item.code,
    text.truncate(item.name, 64),
    `${item.active}`,
    String(item.retries),
    item.cost.toFixed(2),
    String(item.frequencyCap),
    `${item.visible}`,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPayoutBatchViews(items: BatchedPayoutBatch[]): BatchedPayoutBatchView[] {
  const views: BatchedPayoutBatchView[] = [];
  for (const item of items) {
    views.push(toBatchedPayoutBatchView(item));
  }
  return views;
}

export function sumBatchedPayoutBatchView(view: BatchedPayoutBatchView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRetries + parsedCost + parsedFrequencyCap;
}
