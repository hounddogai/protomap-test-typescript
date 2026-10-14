import { LenientLevelRecord } from "./lenient-level-record.js";

/** How screens and exports show a lenient level record. */
export class LenientLevelRecordView {
  code: string;
  name: string;
  amountText: string;
  channel: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    amountText: string,
    channel: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.amountText = amountText;
    this.channel = channel;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLevelRecordView(item: LenientLevelRecord): LenientLevelRecordView {
  return new LenientLevelRecordView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    item.channel,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLevelRecordViews(items: LenientLevelRecord[]): LenientLevelRecordView[] {
  const views: LenientLevelRecordView[] = [];
  for (const item of items) {
    views.push(toLenientLevelRecordView(item));
  }
  return views;
}

export function sumLenientLevelRecordView(view: LenientLevelRecordView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedAmount + parsedBudget;
}
