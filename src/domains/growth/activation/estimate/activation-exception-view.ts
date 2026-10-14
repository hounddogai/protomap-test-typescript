import * as text from "../../../../kit/text.js";
import { ActivationException } from "./activation-exception.js";

/** How screens and exports show a activation exception. */
export class ActivationExceptionView {
  codeText: string;
  nameText: string;
  discount: string;
  bid: string;
  impressions: string;
  revisionText: string;
  region: string;
  ratio: string;
  categoryText: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    discount: string,
    bid: string,
    impressions: string,
    revisionText: string,
    region: string,
    ratio: string,
    categoryText: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.discount = discount;
    this.bid = bid;
    this.impressions = impressions;
    this.revisionText = revisionText;
    this.region = region;
    this.ratio = ratio;
    this.categoryText = categoryText;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toActivationExceptionView(item: ActivationException): ActivationExceptionView {
  return new ActivationExceptionView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    String(item.impressions),
    String(item.revision),
    item.region,
    item.ratio.toFixed(2),
    item.category,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationExceptionViews(items: ActivationException[]): ActivationExceptionView[] {
  const views: ActivationExceptionView[] = [];
  for (const item of items) {
    views.push(toActivationExceptionView(item));
  }
  return views;
}

export function sumActivationExceptionView(view: ActivationExceptionView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedDiscount + parsedBid + parsedImpressions;
}
