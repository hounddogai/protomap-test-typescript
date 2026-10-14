import * as text from "../../../../kit/text.js";
import { ActivationSlot } from "./activation-slot.js";

/** How screens and exports show a activation slot. */
export class ActivationSlotView {
  code: string;
  nameText: string;
  visibleText: string;
  limit: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    visibleText: string,
    limit: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.visibleText = visibleText;
    this.limit = limit;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toActivationSlotView(item: ActivationSlot): ActivationSlotView {
  return new ActivationSlotView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    `${item.visible}`,
    String(item.limit),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationSlotViews(items: ActivationSlot[]): ActivationSlotView[] {
  const views: ActivationSlotView[] = [];
  for (const item of items) {
    views.push(toActivationSlotView(item));
  }
  return views;
}

export function sumActivationSlotView(view: ActivationSlotView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedLimit + parsedMargin;
}
