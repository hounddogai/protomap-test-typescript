import * as text from "../../../../kit/text.js";
import { GlobalBidRuleAgreement } from "./global-bid-rule-agreement.js";

/** How screens and exports show a global bid rule agreement. */
export class GlobalBidRuleAgreementView {
  code: string;
  labelText: string;
  currencyText: string;
  openRate: string;
  updatedAtText: string;
  bid: string;
  capacity: string;
  archived: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    currencyText: string,
    openRate: string,
    updatedAtText: string,
    bid: string,
    capacity: string,
    archived: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.currencyText = currencyText;
    this.openRate = openRate;
    this.updatedAtText = updatedAtText;
    this.bid = bid;
    this.capacity = capacity;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBidRuleAgreementView(item: GlobalBidRuleAgreement): GlobalBidRuleAgreementView {
  return new GlobalBidRuleAgreementView(
    text.truncate(item.code, 40),
    item.label,
    item.currency,
    item.openRate.toFixed(2),
    String(item.updatedAt),
    item.bid.toFixed(2),
    String(item.capacity),
    `${item.archived}`,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBidRuleAgreementViews(items: GlobalBidRuleAgreement[]): GlobalBidRuleAgreementView[] {
  const views: GlobalBidRuleAgreementView[] = [];
  for (const item of items) {
    views.push(toGlobalBidRuleAgreementView(item));
  }
  return views;
}

export function sumGlobalBidRuleAgreementView(view: GlobalBidRuleAgreementView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedOpenRate + parsedUpdatedAt + parsedBid;
}
