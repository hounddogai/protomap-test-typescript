import * as text from "../../../../kit/text.js";
import { RegionalCsatProposal } from "./regional-csat-proposal.js";

/** How screens and exports show a regional csat proposal. */
export class RegionalCsatProposalView {
  codeText: string;
  label: string;
  countryText: string;
  ceiling: string;
  currency: string;
  channel: string;
  discount: string;
  retries: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    countryText: string,
    ceiling: string,
    currency: string,
    channel: string,
    discount: string,
    retries: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.countryText = countryText;
    this.ceiling = ceiling;
    this.currency = currency;
    this.channel = channel;
    this.discount = discount;
    this.retries = retries;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCsatProposalView(item: RegionalCsatProposal): RegionalCsatProposalView {
  return new RegionalCsatProposalView(
    item.code,
    item.label,
    item.country,
    item.ceiling.toFixed(2),
    item.currency,
    item.channel,
    item.discount.toFixed(2),
    String(item.retries),
    text.truncate(item.locale, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCsatProposalViews(items: RegionalCsatProposal[]): RegionalCsatProposalView[] {
  const views: RegionalCsatProposalView[] = [];
  for (const item of items) {
    views.push(toRegionalCsatProposalView(item));
  }
  return views;
}

export function sumRegionalCsatProposalView(view: RegionalCsatProposalView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedCeiling + parsedDiscount + parsedRetries;
}
