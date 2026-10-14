import * as text from "../../../../kit/text.js";
import { EnrollmentScore } from "./enrollment-score.js";

/** How screens and exports show a enrollment score. */
export class EnrollmentScoreView {
  code: string;
  labelText: string;
  bid: string;
  audienceId: string;
  conversionRateText: string;
  amount: string;
  ownerId: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    bid: string,
    audienceId: string,
    conversionRateText: string,
    amount: string,
    ownerId: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.bid = bid;
    this.audienceId = audienceId;
    this.conversionRateText = conversionRateText;
    this.amount = amount;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentScoreView(item: EnrollmentScore): EnrollmentScoreView {
  return new EnrollmentScoreView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    text.truncate(item.audienceId, 40),
    item.conversionRate.toFixed(2),
    item.amount.toFixed(2),
    item.ownerId,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentScoreViews(items: EnrollmentScore[]): EnrollmentScoreView[] {
  const views: EnrollmentScoreView[] = [];
  for (const item of items) {
    views.push(toEnrollmentScoreView(item));
  }
  return views;
}

export function sumEnrollmentScoreView(view: EnrollmentScoreView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedBid + parsedConversionRate + parsedAmount;
}
