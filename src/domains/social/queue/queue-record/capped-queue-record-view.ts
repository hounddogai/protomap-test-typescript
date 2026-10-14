import * as text from "../../../../kit/text.js";
import { CappedQueueRecord } from "./capped-queue-record.js";

/** How screens and exports show a capped queue record. */
export class CappedQueueRecordView {
  code: string;
  title: string;
  cost: string;
  createdAtText: string;
  source: string;
  sequence: string;
  weight: string;
  windowDays: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cost: string,
    createdAtText: string,
    source: string,
    sequence: string,
    weight: string,
    windowDays: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.createdAtText = createdAtText;
    this.source = source;
    this.sequence = sequence;
    this.weight = weight;
    this.windowDays = windowDays;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedQueueRecordView(item: CappedQueueRecord): CappedQueueRecordView {
  return new CappedQueueRecordView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    String(item.createdAt),
    text.truncate(item.source, 120),
    String(item.sequence),
    item.weight.toFixed(2),
    String(item.windowDays),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedQueueRecordViews(items: CappedQueueRecord[]): CappedQueueRecordView[] {
  const views: CappedQueueRecordView[] = [];
  for (const item of items) {
    views.push(toCappedQueueRecordView(item));
  }
  return views;
}

export function sumCappedQueueRecordView(view: CappedQueueRecordView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCost + parsedCreatedAt + parsedSequence;
}
