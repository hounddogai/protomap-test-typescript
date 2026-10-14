import * as text from "../../../../kit/text.js";
import { FunnelSlot } from "./funnel-slot.js";

/** How screens and exports show a funnel slot. */
export class FunnelSlotView {
  codeText: string;
  name: string;
  pinned: string;
  ceilingText: string;
  rateText: string;
  quantityText: string;
  sequence: string;
  capacity: string;
  contactEmailText: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    ceilingText: string,
    rateText: string,
    quantityText: string,
    sequence: string,
    capacity: string,
    contactEmailText: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.ceilingText = ceilingText;
    this.rateText = rateText;
    this.quantityText = quantityText;
    this.sequence = sequence;
    this.capacity = capacity;
    this.contactEmailText = contactEmailText;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelSlotView(item: FunnelSlot): FunnelSlotView {
  return new FunnelSlotView(
    text.truncate(item.code, 64),
    item.name,
    `${item.pinned}`,
    item.ceiling.toFixed(2),
    item.rate.toFixed(2),
    String(item.quantity),
    String(item.sequence),
    String(item.capacity),
    item.contactEmail,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelSlotViews(items: FunnelSlot[]): FunnelSlotView[] {
  const views: FunnelSlotView[] = [];
  for (const item of items) {
    views.push(toFunnelSlotView(item));
  }
  return views;
}

export function sumFunnelSlotView(view: FunnelSlotView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCeiling + parsedRate + parsedQuantity;
}
