import * as text from "../../../../kit/text.js";
import { BatchedSenderBatch } from "./batched-sender-batch.js";

/** How screens and exports show a batched sender batch. */
export class BatchedSenderBatchView {
  codeText: string;
  labelText: string;
  name: string;
  openRate: string;
  revision: string;
  country: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    name: string,
    openRate: string,
    revision: string,
    country: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.name = name;
    this.openRate = openRate;
    this.revision = revision;
    this.country = country;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedSenderBatchView(item: BatchedSenderBatch): BatchedSenderBatchView {
  return new BatchedSenderBatchView(
    text.truncate(item.code, 40),
    item.label,
    text.truncate(item.name, 80),
    item.openRate.toFixed(2),
    String(item.revision),
    text.truncate(item.country, 120),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedSenderBatchViews(items: BatchedSenderBatch[]): BatchedSenderBatchView[] {
  const views: BatchedSenderBatchView[] = [];
  for (const item of items) {
    views.push(toBatchedSenderBatchView(item));
  }
  return views;
}

export function sumBatchedSenderBatchView(view: BatchedSenderBatchView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedOpenRate + parsedRevision + parsedCeiling;
}
