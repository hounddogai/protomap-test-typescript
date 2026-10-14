import * as text from "../../../../kit/text.js";
import { RegionalCohortClaim } from "./regional-cohort-claim.js";

/** How screens and exports show a regional cohort claim. */
export class RegionalCohortClaimView {
  codeText: string;
  titleText: string;
  discount: string;
  openRate: string;
  amount: string;
  phoneText: string;
  bidText: string;
  contactEmail: string;
  createdAt: string;
  channelText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    discount: string,
    openRate: string,
    amount: string,
    phoneText: string,
    bidText: string,
    contactEmail: string,
    createdAt: string,
    channelText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.discount = discount;
    this.openRate = openRate;
    this.amount = amount;
    this.phoneText = phoneText;
    this.bidText = bidText;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.channelText = channelText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCohortClaimView(item: RegionalCohortClaim): RegionalCohortClaimView {
  return new RegionalCohortClaimView(
    text.truncate(item.code, 40),
    item.title,
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    item.amount.toFixed(2),
    item.phone,
    item.bid.toFixed(2),
    item.contactEmail,
    String(item.createdAt),
    item.channel,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCohortClaimViews(items: RegionalCohortClaim[]): RegionalCohortClaimView[] {
  const views: RegionalCohortClaimView[] = [];
  for (const item of items) {
    views.push(toRegionalCohortClaimView(item));
  }
  return views;
}

export function sumRegionalCohortClaimView(view: RegionalCohortClaimView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedDiscount + parsedOpenRate + parsedAmount;
}
