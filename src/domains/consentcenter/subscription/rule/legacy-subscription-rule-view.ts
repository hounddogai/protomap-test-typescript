import * as text from "../../../../kit/text.js";
import { LegacySubscriptionRule } from "./legacy-subscription-rule.js";

/** How screens and exports show a legacy subscription rule. */
export class LegacySubscriptionRuleView {
  code: string;
  titleText: string;
  category: string;
  variantText: string;
  pinned: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    category: string,
    variantText: string,
    pinned: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.category = category;
    this.variantText = variantText;
    this.pinned = pinned;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySubscriptionRuleView(item: LegacySubscriptionRule): LegacySubscriptionRuleView {
  return new LegacySubscriptionRuleView(
    text.truncate(item.code, 40),
    item.title,
    item.category,
    item.variant,
    `${item.pinned}`,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySubscriptionRuleViews(items: LegacySubscriptionRule[]): LegacySubscriptionRuleView[] {
  const views: LegacySubscriptionRuleView[] = [];
  for (const item of items) {
    views.push(toLegacySubscriptionRuleView(item));
  }
  return views;
}

export function sumLegacySubscriptionRuleView(view: LegacySubscriptionRuleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
