import { JourneyLedger } from "./journey-ledger.js";

/** How screens and exports show a journey ledger. */
export class JourneyLedgerView {
  code: string;
  title: string;
  maximum: string;
  archived: string;
  retries: string;
  notesText: string;
  quantityText: string;
  capacity: string;
  budget: string;
  variantText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    maximum: string,
    archived: string,
    retries: string,
    notesText: string,
    quantityText: string,
    capacity: string,
    budget: string,
    variantText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.archived = archived;
    this.retries = retries;
    this.notesText = notesText;
    this.quantityText = quantityText;
    this.capacity = capacity;
    this.budget = budget;
    this.variantText = variantText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyLedgerView(item: JourneyLedger): JourneyLedgerView {
  return new JourneyLedgerView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    `${item.archived}`,
    String(item.retries),
    item.notes,
    String(item.quantity),
    String(item.capacity),
    item.budget.toFixed(2),
    item.variant,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyLedgerViews(items: JourneyLedger[]): JourneyLedgerView[] {
  const views: JourneyLedgerView[] = [];
  for (const item of items) {
    views.push(toJourneyLedgerView(item));
  }
  return views;
}

export function sumJourneyLedgerView(view: JourneyLedgerView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedMaximum + parsedRetries + parsedQuantity;
}
