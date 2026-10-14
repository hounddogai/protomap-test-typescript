import { BatchedReplyException } from "./batched-reply-exception.js";

/** How screens and exports show a batched reply exception. */
export class BatchedReplyExceptionView {
  code: string;
  name: string;
  channel: string;
  pinnedText: string;
  batchSizeText: string;
  ratio: string;
  region: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channel: string,
    pinnedText: string,
    batchSizeText: string,
    ratio: string,
    region: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.pinnedText = pinnedText;
    this.batchSizeText = batchSizeText;
    this.ratio = ratio;
    this.region = region;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedReplyExceptionView(item: BatchedReplyException): BatchedReplyExceptionView {
  return new BatchedReplyExceptionView(
    item.code,
    item.name,
    item.channel,
    `${item.pinned}`,
    String(item.batchSize),
    item.ratio.toFixed(2),
    item.region,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedReplyExceptionViews(items: BatchedReplyException[]): BatchedReplyExceptionView[] {
  const views: BatchedReplyExceptionView[] = [];
  for (const item of items) {
    views.push(toBatchedReplyExceptionView(item));
  }
  return views;
}

export function sumBatchedReplyExceptionView(view: BatchedReplyExceptionView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedBatchSize + parsedRatio;
}
