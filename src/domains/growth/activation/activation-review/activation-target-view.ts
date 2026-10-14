import * as text from "../../../../kit/text.js";
import { ActivationTarget } from "./activation-target.js";

/** How screens and exports show a activation target. */
export class ActivationTargetView {
  code: string;
  name: string;
  capacity: string;
  active: string;
  openRateText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacity: string,
    active: string,
    openRateText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.active = active;
    this.openRateText = openRateText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toActivationTargetView(item: ActivationTarget): ActivationTargetView {
  return new ActivationTargetView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    String(item.capacity),
    `${item.active}`,
    item.openRate.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationTargetViews(items: ActivationTarget[]): ActivationTargetView[] {
  const views: ActivationTargetView[] = [];
  for (const item of items) {
    views.push(toActivationTargetView(item));
  }
  return views;
}

export function sumActivationTargetView(view: ActivationTargetView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCapacity + parsedOpenRate + parsedQuantity;
}
