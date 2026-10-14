import * as text from "../../../../kit/text.js";
import { PendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

/** How screens and exports show a pending reward rule notice. */
export class PendingRewardRuleNoticeView {
  codeText: string;
  name: string;
  phone: string;
  sendAt: string;
  quantity: string;
  titleText: string;
  rateText: string;
  discount: string;
  score: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    phone: string,
    sendAt: string,
    quantity: string,
    titleText: string,
    rateText: string,
    discount: string,
    score: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.phone = phone;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.titleText = titleText;
    this.rateText = rateText;
    this.discount = discount;
    this.score = score;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardRuleNoticeView(item: PendingRewardRuleNotice): PendingRewardRuleNoticeView {
  return new PendingRewardRuleNoticeView(
    item.code,
    item.name,
    item.phone,
    String(item.sendAt),
    String(item.quantity),
    text.truncate(item.title, 80),
    item.rate.toFixed(2),
    item.discount.toFixed(2),
    item.score.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardRuleNoticeViews(items: PendingRewardRuleNotice[]): PendingRewardRuleNoticeView[] {
  const views: PendingRewardRuleNoticeView[] = [];
  for (const item of items) {
    views.push(toPendingRewardRuleNoticeView(item));
  }
  return views;
}

export function sumPendingRewardRuleNoticeView(view: PendingRewardRuleNoticeView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedSendAt + parsedQuantity + parsedRate;
}
