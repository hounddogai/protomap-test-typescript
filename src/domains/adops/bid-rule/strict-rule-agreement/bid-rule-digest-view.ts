import * as text from "../../../../kit/text.js";
import { BidRuleDigest } from "./bid-rule-digest.js";

/** How screens and exports show a bid rule digest. */
export class BidRuleDigestView {
  codeText: string;
  titleText: string;
  frequencyCap: string;
  margin: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    frequencyCap: string,
    margin: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.margin = margin;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleDigestView(item: BidRuleDigest): BidRuleDigestView {
  return new BidRuleDigestView(
    text.truncate(item.code, 80),
    item.title,
    String(item.frequencyCap),
    item.margin.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleDigestViews(items: BidRuleDigest[]): BidRuleDigestView[] {
  const views: BidRuleDigestView[] = [];
  for (const item of items) {
    views.push(toBidRuleDigestView(item));
  }
  return views;
}

export function sumBidRuleDigestView(view: BidRuleDigestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedFrequencyCap + parsedMargin + parsedOpenRate;
}
