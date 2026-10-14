import { RollingPlacementLedger } from "./rolling-placement-ledger.js";

/** How screens and exports show a rolling placement ledger. */
export class RollingPlacementLedgerView {
  codeText: string;
  name: string;
  capacity: string;
  title: string;
  notes: string;
  currency: string;
  discount: string;
  active: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    capacity: string,
    title: string,
    notes: string,
    currency: string,
    discount: string,
    active: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.capacity = capacity;
    this.title = title;
    this.notes = notes;
    this.currency = currency;
    this.discount = discount;
    this.active = active;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPlacementLedgerView(item: RollingPlacementLedger): RollingPlacementLedgerView {
  return new RollingPlacementLedgerView(
    item.code,
    item.name,
    String(item.capacity),
    item.title,
    item.notes,
    item.currency,
    item.discount.toFixed(2),
    `${item.active}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPlacementLedgerViews(items: RollingPlacementLedger[]): RollingPlacementLedgerView[] {
  const views: RollingPlacementLedgerView[] = [];
  for (const item of items) {
    views.push(toRollingPlacementLedgerView(item));
  }
  return views;
}

export function sumRollingPlacementLedgerView(view: RollingPlacementLedgerView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCapacity + parsedDiscount + parsedQuantity;
}
