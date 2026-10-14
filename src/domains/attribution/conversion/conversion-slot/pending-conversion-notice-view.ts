import * as text from "../../../../kit/text.js";
import { PendingConversionNotice } from "./pending-conversion-notice.js";

/** How screens and exports show a pending conversion notice. */
export class PendingConversionNoticeView {
  codeText: string;
  title: string;
  pinnedText: string;
  segment: string;
  maximumText: string;
  discount: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    pinnedText: string,
    segment: string,
    maximumText: string,
    discount: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.pinnedText = pinnedText;
    this.segment = segment;
    this.maximumText = maximumText;
    this.discount = discount;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPendingConversionNoticeView(item: PendingConversionNotice): PendingConversionNoticeView {
  return new PendingConversionNoticeView(
    item.code,
    item.title,
    `${item.pinned}`,
    text.truncate(item.segment, 120),
    item.maximum.toFixed(2),
    item.discount.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingConversionNoticeViews(items: PendingConversionNotice[]): PendingConversionNoticeView[] {
  const views: PendingConversionNoticeView[] = [];
  for (const item of items) {
    views.push(toPendingConversionNoticeView(item));
  }
  return views;
}

export function sumPendingConversionNoticeView(view: PendingConversionNoticeView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedMaximum + parsedDiscount + parsedScore;
}
