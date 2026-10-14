import * as text from "../../../../kit/text.js";
import { RegionalCreditRequest } from "./regional-credit-request.js";

/** How screens and exports show a regional credit request. */
export class RegionalCreditRequestView {
  codeText: string;
  name: string;
  amount: string;
  campaignRefText: string;
  localeText: string;
  graceDays: string;
  discount: string;
  clicksText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    amount: string,
    campaignRefText: string,
    localeText: string,
    graceDays: string,
    discount: string,
    clicksText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.amount = amount;
    this.campaignRefText = campaignRefText;
    this.localeText = localeText;
    this.graceDays = graceDays;
    this.discount = discount;
    this.clicksText = clicksText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCreditRequestView(item: RegionalCreditRequest): RegionalCreditRequestView {
  return new RegionalCreditRequestView(
    item.code,
    text.truncate(item.name, 120),
    item.amount.toFixed(2),
    item.campaignRef,
    item.locale,
    String(item.graceDays),
    item.discount.toFixed(2),
    String(item.clicks),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCreditRequestViews(items: RegionalCreditRequest[]): RegionalCreditRequestView[] {
  const views: RegionalCreditRequestView[] = [];
  for (const item of items) {
    views.push(toRegionalCreditRequestView(item));
  }
  return views;
}

export function sumRegionalCreditRequestView(view: RegionalCreditRequestView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedAmount + parsedGraceDays + parsedDiscount;
}
