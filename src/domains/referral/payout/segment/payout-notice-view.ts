import * as text from "../../../../kit/text.js";
import { PayoutNotice } from "./payout-notice.js";

/** How screens and exports show a payout notice. */
export class PayoutNoticeView {
  code: string;
  label: string;
  createdAt: string;
  summaryText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    createdAt: string,
    summaryText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.summaryText = summaryText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutNoticeView(item: PayoutNotice): PayoutNoticeView {
  return new PayoutNoticeView(
    item.code,
    text.truncate(item.label, 40),
    String(item.createdAt),
    item.summary,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutNoticeViews(items: PayoutNotice[]): PayoutNoticeView[] {
  const views: PayoutNoticeView[] = [];
  for (const item of items) {
    views.push(toPayoutNoticeView(item));
  }
  return views;
}

export function sumPayoutNoticeView(view: PayoutNoticeView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedCreatedAt + parsedBatchSize;
}
