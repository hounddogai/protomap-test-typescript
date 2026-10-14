import * as text from "../../../../kit/text.js";
import { SuppressionAdjustment } from "./suppression-adjustment.js";

/** How screens and exports show a suppression adjustment. */
export class SuppressionAdjustmentView {
  code: string;
  title: string;
  source: string;
  budget: string;
  attemptsText: string;
  variant: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    budget: string,
    attemptsText: string,
    variant: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.budget = budget;
    this.attemptsText = attemptsText;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionAdjustmentView(item: SuppressionAdjustment): SuppressionAdjustmentView {
  return new SuppressionAdjustmentView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    text.truncate(item.source, 80),
    item.budget.toFixed(2),
    String(item.attempts),
    item.variant,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionAdjustmentViews(items: SuppressionAdjustment[]): SuppressionAdjustmentView[] {
  const views: SuppressionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toSuppressionAdjustmentView(item));
  }
  return views;
}

export function sumSuppressionAdjustmentView(view: SuppressionAdjustmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedBudget + parsedAttempts;
}
