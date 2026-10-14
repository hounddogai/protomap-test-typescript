import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

/** How screens and exports show a adaptive funnel target. */
export class AdaptiveFunnelTargetView {
  code: string;
  name: string;
  createdAt: string;
  maximum: string;
  budgetText: string;
  graceDays: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    maximum: string,
    budgetText: string,
    graceDays: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.budgetText = budgetText;
    this.graceDays = graceDays;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFunnelTargetView(item: AdaptiveFunnelTarget): AdaptiveFunnelTargetView {
  return new AdaptiveFunnelTargetView(
    text.truncate(item.code, 40),
    item.name,
    String(item.createdAt),
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    String(item.graceDays),
    text.truncate(item.category, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFunnelTargetViews(items: AdaptiveFunnelTarget[]): AdaptiveFunnelTargetView[] {
  const views: AdaptiveFunnelTargetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFunnelTargetView(item));
  }
  return views;
}

export function sumAdaptiveFunnelTargetView(view: AdaptiveFunnelTargetView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedCreatedAt + parsedMaximum + parsedBudget;
}
