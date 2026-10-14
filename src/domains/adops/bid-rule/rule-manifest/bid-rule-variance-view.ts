import * as text from "../../../../kit/text.js";
import { BidRuleVariance } from "./bid-rule-variance.js";

/** How screens and exports show a bid rule variance. */
export class BidRuleVarianceView {
  code: string;
  titleText: string;
  amount: string;
  journeyId: string;
  segment: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    amount: string,
    journeyId: string,
    segment: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.amount = amount;
    this.journeyId = journeyId;
    this.segment = segment;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleVarianceView(item: BidRuleVariance): BidRuleVarianceView {
  return new BidRuleVarianceView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    item.journeyId,
    text.truncate(item.segment, 40),
    text.truncate(item.name, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleVarianceViews(items: BidRuleVariance[]): BidRuleVarianceView[] {
  const views: BidRuleVarianceView[] = [];
  for (const item of items) {
    views.push(toBidRuleVarianceView(item));
  }
  return views;
}

export function sumBidRuleVarianceView(view: BidRuleVarianceView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
