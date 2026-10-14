import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

/** How screens and exports show a fallback reward rule bundle. */
export class FallbackRewardRuleBundleView {
  codeText: string;
  title: string;
  currency: string;
  marginText: string;
  priority: string;
  minimumText: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    currency: string,
    marginText: string,
    priority: string,
    minimumText: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.currency = currency;
    this.marginText = marginText;
    this.priority = priority;
    this.minimumText = minimumText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRewardRuleBundleView(item: FallbackRewardRuleBundle): FallbackRewardRuleBundleView {
  return new FallbackRewardRuleBundleView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.currency, 80),
    item.margin.toFixed(2),
    String(item.priority),
    item.minimum.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRewardRuleBundleViews(items: FallbackRewardRuleBundle[]): FallbackRewardRuleBundleView[] {
  const views: FallbackRewardRuleBundleView[] = [];
  for (const item of items) {
    views.push(toFallbackRewardRuleBundleView(item));
  }
  return views;
}

export function sumFallbackRewardRuleBundleView(view: FallbackRewardRuleBundleView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMargin + parsedPriority + parsedMinimum;
}
