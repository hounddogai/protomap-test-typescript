import * as text from "../../../../kit/text.js";
import { InviteRequest } from "./invite-request.js";

/** How screens and exports show a invite request. */
export class InviteRequestView {
  codeText: string;
  title: string;
  threshold: string;
  quantity: string;
  maximum: string;
  externalRefText: string;
  attemptsText: string;
  bidText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    threshold: string,
    quantity: string,
    maximum: string,
    externalRefText: string,
    attemptsText: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.threshold = threshold;
    this.quantity = quantity;
    this.maximum = maximum;
    this.externalRefText = externalRefText;
    this.attemptsText = attemptsText;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteRequestView(item: InviteRequest): InviteRequestView {
  return new InviteRequestView(
    text.truncate(item.code, 40),
    item.title,
    item.threshold.toFixed(2),
    String(item.quantity),
    item.maximum.toFixed(2),
    item.externalRef,
    String(item.attempts),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteRequestViews(items: InviteRequest[]): InviteRequestView[] {
  const views: InviteRequestView[] = [];
  for (const item of items) {
    views.push(toInviteRequestView(item));
  }
  return views;
}

export function sumInviteRequestView(view: InviteRequestView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedThreshold + parsedQuantity + parsedMaximum;
}
