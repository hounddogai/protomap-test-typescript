import * as text from "../../../../kit/text.js";
import { BounceDraft } from "./bounce-draft.js";

/** How screens and exports show a bounce draft. */
export class BounceDraftView {
  codeText: string;
  titleText: string;
  discount: string;
  contactEmail: string;
  region: string;
  sendAt: string;
  graceDays: string;
  maximumText: string;
  description: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    discount: string,
    contactEmail: string,
    region: string,
    sendAt: string,
    graceDays: string,
    maximumText: string,
    description: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.region = region;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.maximumText = maximumText;
    this.description = description;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toBounceDraftView(item: BounceDraft): BounceDraftView {
  return new BounceDraftView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.discount.toFixed(2),
    item.contactEmail,
    item.region,
    String(item.sendAt),
    String(item.graceDays),
    item.maximum.toFixed(2),
    item.description,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceDraftViews(items: BounceDraft[]): BounceDraftView[] {
  const views: BounceDraftView[] = [];
  for (const item of items) {
    views.push(toBounceDraftView(item));
  }
  return views;
}

export function sumBounceDraftView(view: BounceDraftView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedDiscount + parsedSendAt + parsedGraceDays;
}
