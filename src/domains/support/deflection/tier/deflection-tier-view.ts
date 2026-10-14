import * as text from "../../../../kit/text.js";
import { DeflectionTier } from "./deflection-tier.js";

/** How screens and exports show a deflection tier. */
export class DeflectionTierView {
  codeText: string;
  titleText: string;
  bid: string;
  rate: string;
  archived: string;
  ownerIdText: string;
  notesText: string;
  discount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    bid: string,
    rate: string,
    archived: string,
    ownerIdText: string,
    notesText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.bid = bid;
    this.rate = rate;
    this.archived = archived;
    this.ownerIdText = ownerIdText;
    this.notesText = notesText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionTierView(item: DeflectionTier): DeflectionTierView {
  return new DeflectionTierView(
    text.truncate(item.code, 40),
    item.title,
    item.bid.toFixed(2),
    item.rate.toFixed(2),
    `${item.archived}`,
    item.ownerId,
    item.notes,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionTierViews(items: DeflectionTier[]): DeflectionTierView[] {
  const views: DeflectionTierView[] = [];
  for (const item of items) {
    views.push(toDeflectionTierView(item));
  }
  return views;
}

export function sumDeflectionTierView(view: DeflectionTierView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedBid + parsedRate + parsedDiscount;
}
