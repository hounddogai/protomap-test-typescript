import * as text from "../../../../kit/text.js";
import { BidRuleRollup } from "./bid-rule-rollup.js";

/** How screens and exports show a bid rule rollup. */
export class BidRuleRollupView {
  code: string;
  labelText: string;
  minimum: string;
  revision: string;
  discountText: string;
  reviewer: string;
  endsAt: string;
  score: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    minimum: string,
    revision: string,
    discountText: string,
    reviewer: string,
    endsAt: string,
    score: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.minimum = minimum;
    this.revision = revision;
    this.discountText = discountText;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.score = score;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleRollupView(item: BidRuleRollup): BidRuleRollupView {
  return new BidRuleRollupView(
    item.code,
    text.truncate(item.label, 120),
    item.minimum.toFixed(2),
    String(item.revision),
    item.discount.toFixed(2),
    item.reviewer,
    String(item.endsAt),
    item.score.toFixed(2),
    text.truncate(item.category, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleRollupViews(items: BidRuleRollup[]): BidRuleRollupView[] {
  const views: BidRuleRollupView[] = [];
  for (const item of items) {
    views.push(toBidRuleRollupView(item));
  }
  return views;
}

export function sumBidRuleRollupView(view: BidRuleRollupView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedMinimum + parsedRevision + parsedDiscount;
}
