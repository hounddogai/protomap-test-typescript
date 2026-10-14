import * as text from "../../../../kit/text.js";
import { BounceRecord } from "./bounce-record.js";

/** How screens and exports show a bounce record. */
export class BounceRecordView {
  code: string;
  label: string;
  budgetText: string;
  variant: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budgetText: string,
    variant: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budgetText = budgetText;
    this.variant = variant;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toBounceRecordView(item: BounceRecord): BounceRecordView {
  return new BounceRecordView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    item.variant,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceRecordViews(items: BounceRecord[]): BounceRecordView[] {
  const views: BounceRecordView[] = [];
  for (const item of items) {
    views.push(toBounceRecordView(item));
  }
  return views;
}

export function sumBounceRecordView(view: BounceRecordView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
