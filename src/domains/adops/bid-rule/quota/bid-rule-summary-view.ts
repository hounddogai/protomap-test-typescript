import * as text from "../../../../kit/text.js";
import { BidRuleSummary } from "./bid-rule-summary.js";

/** How screens and exports show a bid rule summary. */
export class BidRuleSummaryView {
  code: string;
  name: string;
  journeyId: string;
  updatedAt: string;
  weight: string;
  conversionRate: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    updatedAt: string,
    weight: string,
    conversionRate: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.conversionRate = conversionRate;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleSummaryView(item: BidRuleSummary): BidRuleSummaryView {
  return new BidRuleSummaryView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    item.journeyId,
    String(item.updatedAt),
    item.weight.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.label, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleSummaryViews(items: BidRuleSummary[]): BidRuleSummaryView[] {
  const views: BidRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toBidRuleSummaryView(item));
  }
  return views;
}

export function sumBidRuleSummaryView(view: BidRuleSummaryView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedUpdatedAt + parsedWeight + parsedConversionRate;
}
