import * as text from "../../../../kit/text.js";
import { WeightedOptOutRule } from "./weighted-opt-out-rule.js";

/** How screens and exports show a weighted opt out rule. */
export class WeightedOptOutRuleView {
  code: string;
  name: string;
  source: string;
  timezone: string;
  cost: string;
  locale: string;
  sequenceText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    source: string,
    timezone: string,
    cost: string,
    locale: string,
    sequenceText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.timezone = timezone;
    this.cost = cost;
    this.locale = locale;
    this.sequenceText = sequenceText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedOptOutRuleView(item: WeightedOptOutRule): WeightedOptOutRuleView {
  return new WeightedOptOutRuleView(
    item.code,
    item.name,
    item.source,
    item.timezone,
    item.cost.toFixed(2),
    text.truncate(item.locale, 120),
    String(item.sequence),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedOptOutRuleViews(items: WeightedOptOutRule[]): WeightedOptOutRuleView[] {
  const views: WeightedOptOutRuleView[] = [];
  for (const item of items) {
    views.push(toWeightedOptOutRuleView(item));
  }
  return views;
}

export function sumWeightedOptOutRuleView(view: WeightedOptOutRuleView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCost + parsedSequence + parsedDiscount;
}
