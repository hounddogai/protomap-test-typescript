import * as text from "../../../../kit/text.js";
import { GlobalWindowLedger } from "./global-window-ledger.js";

/** How screens and exports show a global window ledger. */
export class GlobalWindowLedgerView {
  codeText: string;
  title: string;
  margin: string;
  visibleText: string;
  capacity: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    margin: string,
    visibleText: string,
    capacity: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.margin = margin;
    this.visibleText = visibleText;
    this.capacity = capacity;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalWindowLedgerView(item: GlobalWindowLedger): GlobalWindowLedgerView {
  return new GlobalWindowLedgerView(
    text.truncate(item.code, 120),
    item.title,
    item.margin.toFixed(2),
    `${item.visible}`,
    String(item.capacity),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalWindowLedgerViews(items: GlobalWindowLedger[]): GlobalWindowLedgerView[] {
  const views: GlobalWindowLedgerView[] = [];
  for (const item of items) {
    views.push(toGlobalWindowLedgerView(item));
  }
  return views;
}

export function sumGlobalWindowLedgerView(view: GlobalWindowLedgerView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedMargin + parsedCapacity + parsedBudget;
}
