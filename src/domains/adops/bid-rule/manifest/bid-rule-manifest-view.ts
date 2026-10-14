import * as text from "../../../../kit/text.js";
import { BidRuleManifest } from "./bid-rule-manifest.js";

/** How screens and exports show a bid rule manifest. */
export class BidRuleManifestView {
  code: string;
  labelText: string;
  ratio: string;
  bidText: string;
  frequencyCap: string;
  updatedAtText: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ratio: string,
    bidText: string,
    frequencyCap: string,
    updatedAtText: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ratio = ratio;
    this.bidText = bidText;
    this.frequencyCap = frequencyCap;
    this.updatedAtText = updatedAtText;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleManifestView(item: BidRuleManifest): BidRuleManifestView {
  return new BidRuleManifestView(
    item.code,
    text.truncate(item.label, 64),
    item.ratio.toFixed(2),
    item.bid.toFixed(2),
    String(item.frequencyCap),
    String(item.updatedAt),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleManifestViews(items: BidRuleManifest[]): BidRuleManifestView[] {
  const views: BidRuleManifestView[] = [];
  for (const item of items) {
    views.push(toBidRuleManifestView(item));
  }
  return views;
}

export function sumBidRuleManifestView(view: BidRuleManifestView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRatio + parsedBid + parsedFrequencyCap;
}
