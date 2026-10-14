import { WaitSlot } from "./wait-slot.js";

/** How screens and exports show a wait slot. */
export class WaitSlotView {
  code: string;
  labelText: string;
  cohort: string;
  frequencyCapText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cohort: string,
    frequencyCapText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cohort = cohort;
    this.frequencyCapText = frequencyCapText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toWaitSlotView(item: WaitSlot): WaitSlotView {
  return new WaitSlotView(
    item.code,
    item.label,
    item.cohort,
    String(item.frequencyCap),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitSlotViews(items: WaitSlot[]): WaitSlotView[] {
  const views: WaitSlotView[] = [];
  for (const item of items) {
    views.push(toWaitSlotView(item));
  }
  return views;
}

export function sumWaitSlotView(view: WaitSlotView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedFrequencyCap + parsedDiscount;
}
