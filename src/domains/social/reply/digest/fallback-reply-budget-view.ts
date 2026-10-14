import * as text from "../../../../kit/text.js";
import { FallbackReplyBudget } from "./fallback-reply-budget.js";

/** How screens and exports show a fallback reply budget. */
export class FallbackReplyBudgetView {
  code: string;
  nameText: string;
  ceiling: string;
  ratioText: string;
  locale: string;
  priority: string;
  startsAtText: string;
  pinned: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ceiling: string,
    ratioText: string,
    locale: string,
    priority: string,
    startsAtText: string,
    pinned: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ceiling = ceiling;
    this.ratioText = ratioText;
    this.locale = locale;
    this.priority = priority;
    this.startsAtText = startsAtText;
    this.pinned = pinned;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackReplyBudgetView(item: FallbackReplyBudget): FallbackReplyBudgetView {
  return new FallbackReplyBudgetView(
    text.truncate(item.code, 80),
    item.name,
    item.ceiling.toFixed(2),
    item.ratio.toFixed(2),
    item.locale,
    String(item.priority),
    String(item.startsAt),
    `${item.pinned}`,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackReplyBudgetViews(items: FallbackReplyBudget[]): FallbackReplyBudgetView[] {
  const views: FallbackReplyBudgetView[] = [];
  for (const item of items) {
    views.push(toFallbackReplyBudgetView(item));
  }
  return views;
}

export function sumFallbackReplyBudgetView(view: FallbackReplyBudgetView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedCeiling + parsedRatio + parsedPriority;
}
