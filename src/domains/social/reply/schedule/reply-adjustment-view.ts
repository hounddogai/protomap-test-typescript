import * as text from "../../../../kit/text.js";
import { ReplyAdjustment } from "./reply-adjustment.js";

/** How screens and exports show a reply adjustment. */
export class ReplyAdjustmentView {
  code: string;
  nameText: string;
  batchSize: string;
  externalRefText: string;
  startsAt: string;
  limit: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    batchSize: string,
    externalRefText: string,
    startsAt: string,
    limit: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.externalRefText = externalRefText;
    this.startsAt = startsAt;
    this.limit = limit;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toReplyAdjustmentView(item: ReplyAdjustment): ReplyAdjustmentView {
  return new ReplyAdjustmentView(
    item.code,
    item.name,
    String(item.batchSize),
    text.truncate(item.externalRef, 80),
    String(item.startsAt),
    String(item.limit),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyAdjustmentViews(items: ReplyAdjustment[]): ReplyAdjustmentView[] {
  const views: ReplyAdjustmentView[] = [];
  for (const item of items) {
    views.push(toReplyAdjustmentView(item));
  }
  return views;
}

export function sumReplyAdjustmentView(view: ReplyAdjustmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBatchSize + parsedStartsAt + parsedLimit;
}
