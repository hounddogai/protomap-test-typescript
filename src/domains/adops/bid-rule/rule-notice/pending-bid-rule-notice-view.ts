import * as text from "../../../../kit/text.js";
import { PendingBidRuleNotice } from "./pending-bid-rule-notice.js";

/** How screens and exports show a pending bid rule notice. */
export class PendingBidRuleNoticeView {
  code: string;
  title: string;
  limitText: string;
  quantityText: string;
  channelText: string;
  name: string;
  sequence: string;
  categoryText: string;
  ratioText: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limitText: string,
    quantityText: string,
    channelText: string,
    name: string,
    sequence: string,
    categoryText: string,
    ratioText: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limitText = limitText;
    this.quantityText = quantityText;
    this.channelText = channelText;
    this.name = name;
    this.sequence = sequence;
    this.categoryText = categoryText;
    this.ratioText = ratioText;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBidRuleNoticeView(item: PendingBidRuleNotice): PendingBidRuleNoticeView {
  return new PendingBidRuleNoticeView(
    text.truncate(item.code, 40),
    item.title,
    String(item.limit),
    String(item.quantity),
    item.channel,
    text.truncate(item.name, 80),
    String(item.sequence),
    text.truncate(item.category, 64),
    item.ratio.toFixed(2),
    text.truncate(item.journeyId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBidRuleNoticeViews(items: PendingBidRuleNotice[]): PendingBidRuleNoticeView[] {
  const views: PendingBidRuleNoticeView[] = [];
  for (const item of items) {
    views.push(toPendingBidRuleNoticeView(item));
  }
  return views;
}

export function sumPendingBidRuleNoticeView(view: PendingBidRuleNoticeView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedLimit + parsedQuantity + parsedSequence;
}
