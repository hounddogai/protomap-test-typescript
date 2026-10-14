import * as text from "../../../../kit/text.js";
import { BatchedInviteNotice } from "./batched-invite-notice.js";

/** How screens and exports show a batched invite notice. */
export class BatchedInviteNoticeView {
  code: string;
  name: string;
  batchSizeText: string;
  createdAt: string;
  sendAtText: string;
  quantity: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    batchSizeText: string,
    createdAt: string,
    sendAtText: string,
    quantity: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.batchSizeText = batchSizeText;
    this.createdAt = createdAt;
    this.sendAtText = sendAtText;
    this.quantity = quantity;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInviteNoticeView(item: BatchedInviteNotice): BatchedInviteNoticeView {
  return new BatchedInviteNoticeView(
    item.code,
    text.truncate(item.name, 120),
    String(item.batchSize),
    String(item.createdAt),
    String(item.sendAt),
    String(item.quantity),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInviteNoticeViews(items: BatchedInviteNotice[]): BatchedInviteNoticeView[] {
  const views: BatchedInviteNoticeView[] = [];
  for (const item of items) {
    views.push(toBatchedInviteNoticeView(item));
  }
  return views;
}

export function sumBatchedInviteNoticeView(view: BatchedInviteNoticeView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedBatchSize + parsedCreatedAt + parsedSendAt;
}
