import * as text from "../../../../kit/text.js";
import { ManualJourneySlot } from "./manual-journey-slot.js";

/** How screens and exports show a manual journey slot. */
export class ManualJourneySlotView {
  code: string;
  label: string;
  discountText: string;
  externalRef: string;
  channel: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    discountText: string,
    externalRef: string,
    channel: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.discountText = discountText;
    this.externalRef = externalRef;
    this.channel = channel;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toManualJourneySlotView(item: ManualJourneySlot): ManualJourneySlotView {
  return new ManualJourneySlotView(
    text.truncate(item.code, 64),
    item.label,
    item.discount.toFixed(2),
    item.externalRef,
    item.channel,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualJourneySlotViews(items: ManualJourneySlot[]): ManualJourneySlotView[] {
  const views: ManualJourneySlotView[] = [];
  for (const item of items) {
    views.push(toManualJourneySlotView(item));
  }
  return views;
}

export function sumManualJourneySlotView(view: ManualJourneySlotView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedDiscount + parsedRetries;
}
