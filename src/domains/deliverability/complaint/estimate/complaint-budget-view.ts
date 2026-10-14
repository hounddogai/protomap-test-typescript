import * as text from "../../../../kit/text.js";
import { ComplaintBudget } from "./complaint-budget.js";

/** How screens and exports show a complaint budget. */
export class ComplaintBudgetView {
  code: string;
  name: string;
  sequence: string;
  notes: string;
  quantity: string;
  statusLabel: string;

  constructor(code: string, name: string, sequence: string, notes: string, quantity: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.notes = notes;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintBudgetView(item: ComplaintBudget): ComplaintBudgetView {
  return new ComplaintBudgetView(
    item.code,
    text.truncate(item.name, 120),
    String(item.sequence),
    item.notes,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintBudgetViews(items: ComplaintBudget[]): ComplaintBudgetView[] {
  const views: ComplaintBudgetView[] = [];
  for (const item of items) {
    views.push(toComplaintBudgetView(item));
  }
  return views;
}

export function sumComplaintBudgetView(view: ComplaintBudgetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedSequence + parsedQuantity;
}
