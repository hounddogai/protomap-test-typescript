import * as text from "../../../../kit/text.js";
import { ReplyRequest } from "./reply-request.js";

/** How screens and exports show a reply request. */
export class ReplyRequestView {
  code: string;
  title: string;
  currencyText: string;
  rateText: string;
  bid: string;
  quantityText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currencyText: string,
    rateText: string,
    bid: string,
    quantityText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currencyText = currencyText;
    this.rateText = rateText;
    this.bid = bid;
    this.quantityText = quantityText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyRequestView(item: ReplyRequest): ReplyRequestView {
  return new ReplyRequestView(
    item.code,
    text.truncate(item.title, 64),
    item.currency,
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    String(item.quantity),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyRequestViews(items: ReplyRequest[]): ReplyRequestView[] {
  const views: ReplyRequestView[] = [];
  for (const item of items) {
    views.push(toReplyRequestView(item));
  }
  return views;
}

export function sumReplyRequestView(view: ReplyRequestView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedRate + parsedBid + parsedQuantity;
}
