import * as text from "../../../../kit/text.js";
import { BadgeLedger } from "./badge-ledger.js";

/** How screens and exports show a badge ledger. */
export class BadgeLedgerView {
  codeText: string;
  name: string;
  pinned: string;
  description: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    description: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.description = description;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeLedgerView(item: BadgeLedger): BadgeLedgerView {
  return new BadgeLedgerView(
    text.truncate(item.code, 120),
    item.name,
    `${item.pinned}`,
    text.truncate(item.description, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeLedgerViews(items: BadgeLedger[]): BadgeLedgerView[] {
  const views: BadgeLedgerView[] = [];
  for (const item of items) {
    views.push(toBadgeLedgerView(item));
  }
  return views;
}

export function sumBadgeLedgerView(view: BadgeLedgerView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
