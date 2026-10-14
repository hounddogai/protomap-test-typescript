import * as text from "../../../../kit/text.js";
import { OptOutSlot } from "./opt-out-slot.js";

/** How screens and exports show a opt out slot. */
export class OptOutSlotView {
  codeText: string;
  titleText: string;
  timezoneText: string;
  cohortText: string;
  pinnedText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    timezoneText: string,
    cohortText: string,
    pinnedText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.timezoneText = timezoneText;
    this.cohortText = cohortText;
    this.pinnedText = pinnedText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutSlotView(item: OptOutSlot): OptOutSlotView {
  return new OptOutSlotView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.timezone, 120),
    item.cohort,
    `${item.pinned}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutSlotViews(items: OptOutSlot[]): OptOutSlotView[] {
  const views: OptOutSlotView[] = [];
  for (const item of items) {
    views.push(toOptOutSlotView(item));
  }
  return views;
}

export function sumOptOutSlotView(view: OptOutSlotView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
