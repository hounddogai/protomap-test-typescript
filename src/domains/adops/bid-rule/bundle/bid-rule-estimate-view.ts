import * as text from "../../../../kit/text.js";
import { BidRuleEstimate } from "./bid-rule-estimate.js";

/** How screens and exports show a bid rule estimate. */
export class BidRuleEstimateView {
  code: string;
  nameText: string;
  conversionRate: string;
  amountText: string;
  summary: string;
  version: string;
  journeyId: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRate: string,
    amountText: string,
    summary: string,
    version: string,
    journeyId: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRate = conversionRate;
    this.amountText = amountText;
    this.summary = summary;
    this.version = version;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleEstimateView(item: BidRuleEstimate): BidRuleEstimateView {
  return new BidRuleEstimateView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    item.amount.toFixed(2),
    item.summary,
    String(item.version),
    text.truncate(item.journeyId, 40),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleEstimateViews(items: BidRuleEstimate[]): BidRuleEstimateView[] {
  const views: BidRuleEstimateView[] = [];
  for (const item of items) {
    views.push(toBidRuleEstimateView(item));
  }
  return views;
}

export function sumBidRuleEstimateView(view: BidRuleEstimateView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedConversionRate + parsedAmount + parsedVersion;
}
