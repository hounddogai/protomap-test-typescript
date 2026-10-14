import * as text from "../../../../kit/text.js";
import { RollingCreditSummary } from "./rolling-credit-summary.js";

/** How screens and exports show a rolling credit summary. */
export class RollingCreditSummaryView {
  codeText: string;
  name: string;
  ratioText: string;
  title: string;
  externalRef: string;
  bidText: string;
  conversionRate: string;
  version: string;
  contactEmail: string;
  labelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratioText: string,
    title: string,
    externalRef: string,
    bidText: string,
    conversionRate: string,
    version: string,
    contactEmail: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratioText = ratioText;
    this.title = title;
    this.externalRef = externalRef;
    this.bidText = bidText;
    this.conversionRate = conversionRate;
    this.version = version;
    this.contactEmail = contactEmail;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCreditSummaryView(item: RollingCreditSummary): RollingCreditSummaryView {
  return new RollingCreditSummaryView(
    text.truncate(item.code, 40),
    item.name,
    item.ratio.toFixed(2),
    item.title,
    item.externalRef,
    item.bid.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.version),
    item.contactEmail,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCreditSummaryViews(items: RollingCreditSummary[]): RollingCreditSummaryView[] {
  const views: RollingCreditSummaryView[] = [];
  for (const item of items) {
    views.push(toRollingCreditSummaryView(item));
  }
  return views;
}

export function sumRollingCreditSummaryView(view: RollingCreditSummaryView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedRatio + parsedBid + parsedConversionRate;
}
