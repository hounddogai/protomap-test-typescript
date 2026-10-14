import * as text from "../../../../kit/text.js";
import { BatchedPostMilestone } from "./batched-post-milestone.js";

/** How screens and exports show a batched post milestone. */
export class BatchedPostMilestoneView {
  code: string;
  name: string;
  sendAtText: string;
  summary: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sendAtText: string,
    summary: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sendAtText = sendAtText;
    this.summary = summary;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPostMilestoneView(item: BatchedPostMilestone): BatchedPostMilestoneView {
  return new BatchedPostMilestoneView(
    item.code,
    text.truncate(item.name, 64),
    String(item.sendAt),
    text.truncate(item.summary, 120),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPostMilestoneViews(items: BatchedPostMilestone[]): BatchedPostMilestoneView[] {
  const views: BatchedPostMilestoneView[] = [];
  for (const item of items) {
    views.push(toBatchedPostMilestoneView(item));
  }
  return views;
}

export function sumBatchedPostMilestoneView(view: BatchedPostMilestoneView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedSendAt + parsedQuantity;
}
