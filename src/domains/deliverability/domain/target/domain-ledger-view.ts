import * as text from "../../../../kit/text.js";
import { DomainLedger } from "./domain-ledger.js";

/** How screens and exports show a domain ledger. */
export class DomainLedgerView {
  codeText: string;
  name: string;
  bid: string;
  openRate: string;
  updatedAt: string;
  campaignRef: string;
  discountText: string;
  contactEmailText: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    bid: string,
    openRate: string,
    updatedAt: string,
    campaignRef: string,
    discountText: string,
    contactEmailText: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.bid = bid;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.discountText = discountText;
    this.contactEmailText = contactEmailText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toDomainLedgerView(item: DomainLedger): DomainLedgerView {
  return new DomainLedgerView(
    text.truncate(item.code, 80),
    item.name,
    item.bid.toFixed(2),
    item.openRate.toFixed(2),
    String(item.updatedAt),
    item.campaignRef,
    item.discount.toFixed(2),
    item.contactEmail,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainLedgerViews(items: DomainLedger[]): DomainLedgerView[] {
  const views: DomainLedgerView[] = [];
  for (const item of items) {
    views.push(toDomainLedgerView(item));
  }
  return views;
}

export function sumDomainLedgerView(view: DomainLedgerView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBid + parsedOpenRate + parsedUpdatedAt;
}
