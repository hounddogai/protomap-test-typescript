import * as text from "../../../../kit/text.js";
import { ReplyManifest } from "./reply-manifest.js";

/** How screens and exports show a reply manifest. */
export class ReplyManifestView {
  code: string;
  nameText: string;
  discountText: string;
  threshold: string;
  source: string;
  updatedAt: string;
  clicksText: string;
  campaignRefText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    discountText: string,
    threshold: string,
    source: string,
    updatedAt: string,
    clicksText: string,
    campaignRefText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.discountText = discountText;
    this.threshold = threshold;
    this.source = source;
    this.updatedAt = updatedAt;
    this.clicksText = clicksText;
    this.campaignRefText = campaignRefText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toReplyManifestView(item: ReplyManifest): ReplyManifestView {
  return new ReplyManifestView(
    item.code,
    text.truncate(item.name, 40),
    item.discount.toFixed(2),
    item.threshold.toFixed(2),
    item.source,
    String(item.updatedAt),
    String(item.clicks),
    item.campaignRef,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyManifestViews(items: ReplyManifest[]): ReplyManifestView[] {
  const views: ReplyManifestView[] = [];
  for (const item of items) {
    views.push(toReplyManifestView(item));
  }
  return views;
}

export function sumReplyManifestView(view: ReplyManifestView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedDiscount + parsedThreshold + parsedUpdatedAt;
}
