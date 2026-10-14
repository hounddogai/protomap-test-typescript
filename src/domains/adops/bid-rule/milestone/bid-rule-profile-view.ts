import * as text from "../../../../kit/text.js";
import { BidRuleProfile } from "./bid-rule-profile.js";

/** How screens and exports show a bid rule profile. */
export class BidRuleProfileView {
  codeText: string;
  label: string;
  bid: string;
  batchSize: string;
  countryText: string;
  localeText: string;
  approved: string;
  unit: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bid: string,
    batchSize: string,
    countryText: string,
    localeText: string,
    approved: string,
    unit: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bid = bid;
    this.batchSize = batchSize;
    this.countryText = countryText;
    this.localeText = localeText;
    this.approved = approved;
    this.unit = unit;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleProfileView(item: BidRuleProfile): BidRuleProfileView {
  return new BidRuleProfileView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    String(item.batchSize),
    text.truncate(item.country, 40),
    item.locale,
    `${item.approved}`,
    item.unit,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleProfileViews(items: BidRuleProfile[]): BidRuleProfileView[] {
  const views: BidRuleProfileView[] = [];
  for (const item of items) {
    views.push(toBidRuleProfileView(item));
  }
  return views;
}

export function sumBidRuleProfileView(view: BidRuleProfileView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBid + parsedBatchSize + parsedSendAt;
}
