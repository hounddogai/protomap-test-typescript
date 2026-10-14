import * as text from "../../../../kit/text.js";
import { RollingPostBudget } from "./rolling-post-budget.js";

/** How screens and exports show a rolling post budget. */
export class RollingPostBudgetView {
  code: string;
  name: string;
  sequence: string;
  unitText: string;
  pinnedText: string;
  quantity: string;
  reviewerText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sequence: string,
    unitText: string,
    pinnedText: string,
    quantity: string,
    reviewerText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.unitText = unitText;
    this.pinnedText = pinnedText;
    this.quantity = quantity;
    this.reviewerText = reviewerText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPostBudgetView(item: RollingPostBudget): RollingPostBudgetView {
  return new RollingPostBudgetView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    String(item.sequence),
    text.truncate(item.unit, 120),
    `${item.pinned}`,
    String(item.quantity),
    text.truncate(item.reviewer, 120),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPostBudgetViews(items: RollingPostBudget[]): RollingPostBudgetView[] {
  const views: RollingPostBudgetView[] = [];
  for (const item of items) {
    views.push(toRollingPostBudgetView(item));
  }
  return views;
}

export function sumRollingPostBudgetView(view: RollingPostBudgetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedSequence + parsedQuantity + parsedDurationMinutes;
}
