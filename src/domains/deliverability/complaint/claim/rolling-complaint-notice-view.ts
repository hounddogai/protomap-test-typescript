import * as text from "../../../../kit/text.js";
import { RollingComplaintNotice } from "./rolling-complaint-notice.js";

/** How screens and exports show a rolling complaint notice. */
export class RollingComplaintNoticeView {
  code: string;
  title: string;
  sendAtText: string;
  quantityText: string;
  summary: string;
  scoreText: string;
  graceDays: string;
  channel: string;
  pinnedText: string;
  maximum: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAtText: string,
    quantityText: string,
    summary: string,
    scoreText: string,
    graceDays: string,
    channel: string,
    pinnedText: string,
    maximum: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAtText = sendAtText;
    this.quantityText = quantityText;
    this.summary = summary;
    this.scoreText = scoreText;
    this.graceDays = graceDays;
    this.channel = channel;
    this.pinnedText = pinnedText;
    this.maximum = maximum;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toRollingComplaintNoticeView(item: RollingComplaintNotice): RollingComplaintNoticeView {
  return new RollingComplaintNoticeView(
    text.truncate(item.code, 80),
    item.title,
    String(item.sendAt),
    String(item.quantity),
    item.summary,
    item.score.toFixed(2),
    String(item.graceDays),
    item.channel,
    `${item.pinned}`,
    item.maximum.toFixed(2),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingComplaintNoticeViews(items: RollingComplaintNotice[]): RollingComplaintNoticeView[] {
  const views: RollingComplaintNoticeView[] = [];
  for (const item of items) {
    views.push(toRollingComplaintNoticeView(item));
  }
  return views;
}

export function sumRollingComplaintNoticeView(view: RollingComplaintNoticeView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedSendAt + parsedQuantity + parsedScore;
}
