import * as text from "../../../../kit/text.js";
import { CappedActivationSlot } from "./capped-activation-slot.js";

/** How screens and exports show a capped activation slot. */
export class CappedActivationSlotView {
  code: string;
  nameText: string;
  priority: string;
  amountText: string;
  sendAtText: string;
  phoneText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    priority: string,
    amountText: string,
    sendAtText: string,
    phoneText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.priority = priority;
    this.amountText = amountText;
    this.sendAtText = sendAtText;
    this.phoneText = phoneText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toCappedActivationSlotView(item: CappedActivationSlot): CappedActivationSlotView {
  return new CappedActivationSlotView(
    item.code,
    item.name,
    String(item.priority),
    item.amount.toFixed(2),
    String(item.sendAt),
    text.truncate(item.phone, 80),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedActivationSlotViews(items: CappedActivationSlot[]): CappedActivationSlotView[] {
  const views: CappedActivationSlotView[] = [];
  for (const item of items) {
    views.push(toCappedActivationSlotView(item));
  }
  return views;
}

export function sumCappedActivationSlotView(view: CappedActivationSlotView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedPriority + parsedAmount + parsedSendAt;
}
