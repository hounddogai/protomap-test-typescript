import * as text from "../../../../kit/text.js";
import { PrimaryConversionRule } from "./primary-conversion-rule.js";

/** How screens and exports show a primary conversion rule. */
export class PrimaryConversionRuleView {
  code: string;
  titleText: string;
  notes: string;
  variant: string;
  cost: string;
  attempts: string;
  quantity: string;
  budget: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    notes: string,
    variant: string,
    cost: string,
    attempts: string,
    quantity: string,
    budget: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.notes = notes;
    this.variant = variant;
    this.cost = cost;
    this.attempts = attempts;
    this.quantity = quantity;
    this.budget = budget;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryConversionRuleView(item: PrimaryConversionRule): PrimaryConversionRuleView {
  return new PrimaryConversionRuleView(
    item.code,
    item.title,
    text.truncate(item.notes, 40),
    item.variant,
    item.cost.toFixed(2),
    String(item.attempts),
    String(item.quantity),
    item.budget.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryConversionRuleViews(items: PrimaryConversionRule[]): PrimaryConversionRuleView[] {
  const views: PrimaryConversionRuleView[] = [];
  for (const item of items) {
    views.push(toPrimaryConversionRuleView(item));
  }
  return views;
}

export function sumPrimaryConversionRuleView(view: PrimaryConversionRuleView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCost + parsedAttempts + parsedQuantity;
}
