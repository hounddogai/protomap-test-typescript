import * as text from "../../../../kit/text.js";
import { RollingTierRollup } from "./rolling-tier-rollup.js";

/** How screens and exports show a rolling tier rollup. */
export class RollingTierRollupView {
  code: string;
  label: string;
  minimum: string;
  amount: string;
  clicks: string;
  quantity: string;
  expiresAtText: string;
  budget: string;
  summaryText: string;
  locale: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    amount: string,
    clicks: string,
    quantity: string,
    expiresAtText: string,
    budget: string,
    summaryText: string,
    locale: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.amount = amount;
    this.clicks = clicks;
    this.quantity = quantity;
    this.expiresAtText = expiresAtText;
    this.budget = budget;
    this.summaryText = summaryText;
    this.locale = locale;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toRollingTierRollupView(item: RollingTierRollup): RollingTierRollupView {
  return new RollingTierRollupView(
    item.code,
    text.truncate(item.label, 80),
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    String(item.clicks),
    String(item.quantity),
    String(item.expiresAt),
    item.budget.toFixed(2),
    item.summary,
    item.locale,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingTierRollupViews(items: RollingTierRollup[]): RollingTierRollupView[] {
  const views: RollingTierRollupView[] = [];
  for (const item of items) {
    views.push(toRollingTierRollupView(item));
  }
  return views;
}

export function sumRollingTierRollupView(view: RollingTierRollupView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedMinimum + parsedAmount + parsedClicks;
}
