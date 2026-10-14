import * as text from "../../../../kit/text.js";
import { SlaSlot } from "./sla-slot.js";

/** How screens and exports show a sla slot. */
export class SlaSlotView {
  codeText: string;
  labelText: string;
  graceDaysText: string;
  currency: string;
  segment: string;
  capacityText: string;
  nameText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    graceDaysText: string,
    currency: string,
    segment: string,
    capacityText: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.graceDaysText = graceDaysText;
    this.currency = currency;
    this.segment = segment;
    this.capacityText = capacityText;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaSlotView(item: SlaSlot): SlaSlotView {
  return new SlaSlotView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 120),
    String(item.graceDays),
    text.truncate(item.currency, 80),
    item.segment,
    String(item.capacity),
    text.truncate(item.name, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaSlotViews(items: SlaSlot[]): SlaSlotView[] {
  const views: SlaSlotView[] = [];
  for (const item of items) {
    views.push(toSlaSlotView(item));
  }
  return views;
}

export function sumSlaSlotView(view: SlaSlotView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedGraceDays + parsedCapacity;
}
