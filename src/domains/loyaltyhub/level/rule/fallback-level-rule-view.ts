import * as text from "../../../../kit/text.js";
import { FallbackLevelRule } from "./fallback-level-rule.js";

/** How screens and exports show a fallback level rule. */
export class FallbackLevelRuleView {
  code: string;
  label: string;
  locale: string;
  approved: string;
  bid: string;
  statusLabel: string;

  constructor(code: string, label: string, locale: string, approved: string, bid: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.approved = approved;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackLevelRuleView(item: FallbackLevelRule): FallbackLevelRuleView {
  return new FallbackLevelRuleView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    item.locale,
    `${item.approved}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackLevelRuleViews(items: FallbackLevelRule[]): FallbackLevelRuleView[] {
  const views: FallbackLevelRuleView[] = [];
  for (const item of items) {
    views.push(toFallbackLevelRuleView(item));
  }
  return views;
}

export function sumFallbackLevelRuleView(view: FallbackLevelRuleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
