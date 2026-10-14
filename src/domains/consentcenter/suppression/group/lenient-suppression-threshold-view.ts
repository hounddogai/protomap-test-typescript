import * as text from "../../../../kit/text.js";
import { LenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

/** How screens and exports show a lenient suppression threshold. */
export class LenientSuppressionThresholdView {
  code: string;
  nameText: string;
  category: string;
  budget: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    category: string,
    budget: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.category = category;
    this.budget = budget;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSuppressionThresholdView(item: LenientSuppressionThreshold): LenientSuppressionThresholdView {
  return new LenientSuppressionThresholdView(
    text.truncate(item.code, 40),
    item.name,
    text.truncate(item.category, 40),
    item.budget.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSuppressionThresholdViews(items: LenientSuppressionThreshold[]): LenientSuppressionThresholdView[] {
  const views: LenientSuppressionThresholdView[] = [];
  for (const item of items) {
    views.push(toLenientSuppressionThresholdView(item));
  }
  return views;
}

export function sumLenientSuppressionThresholdView(view: LenientSuppressionThresholdView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
