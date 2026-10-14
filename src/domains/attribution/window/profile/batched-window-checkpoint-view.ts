import * as text from "../../../../kit/text.js";
import { BatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

/** How screens and exports show a batched window checkpoint. */
export class BatchedWindowCheckpointView {
  codeText: string;
  title: string;
  attempts: string;
  campaignRef: string;
  bid: string;
  batchSize: string;
  sendAt: string;
  capacity: string;
  approved: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attempts: string,
    campaignRef: string,
    bid: string,
    batchSize: string,
    sendAt: string,
    capacity: string,
    approved: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.capacity = capacity;
    this.approved = approved;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWindowCheckpointView(item: BatchedWindowCheckpoint): BatchedWindowCheckpointView {
  return new BatchedWindowCheckpointView(
    item.code,
    item.title,
    String(item.attempts),
    text.truncate(item.campaignRef, 120),
    item.bid.toFixed(2),
    String(item.batchSize),
    String(item.sendAt),
    String(item.capacity),
    `${item.approved}`,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWindowCheckpointViews(items: BatchedWindowCheckpoint[]): BatchedWindowCheckpointView[] {
  const views: BatchedWindowCheckpointView[] = [];
  for (const item of items) {
    views.push(toBatchedWindowCheckpointView(item));
  }
  return views;
}

export function sumBatchedWindowCheckpointView(view: BatchedWindowCheckpointView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedAttempts + parsedBid + parsedBatchSize;
}
