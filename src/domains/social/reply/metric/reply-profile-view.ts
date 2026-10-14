import * as text from "../../../../kit/text.js";
import { ReplyProfile } from "./reply-profile.js";

/** How screens and exports show a reply profile. */
export class ReplyProfileView {
  codeText: string;
  name: string;
  limitText: string;
  amountText: string;
  bidText: string;
  batchSize: string;
  startsAt: string;
  openRate: string;
  ceilingText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    limitText: string,
    amountText: string,
    bidText: string,
    batchSize: string,
    startsAt: string,
    openRate: string,
    ceilingText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.limitText = limitText;
    this.amountText = amountText;
    this.bidText = bidText;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.ceilingText = ceilingText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toReplyProfileView(item: ReplyProfile): ReplyProfileView {
  return new ReplyProfileView(
    text.truncate(item.code, 40),
    item.name,
    String(item.limit),
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    String(item.batchSize),
    String(item.startsAt),
    item.openRate.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyProfileViews(items: ReplyProfile[]): ReplyProfileView[] {
  const views: ReplyProfileView[] = [];
  for (const item of items) {
    views.push(toReplyProfileView(item));
  }
  return views;
}

export function sumReplyProfileView(view: ReplyProfileView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedLimit + parsedAmount + parsedBid;
}
