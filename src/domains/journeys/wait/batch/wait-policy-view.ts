import * as text from "../../../../kit/text.js";
import { WaitPolicy } from "./wait-policy.js";

/** How screens and exports show a wait policy. */
export class WaitPolicyView {
  code: string;
  labelText: string;
  durationMinutesText: string;
  quantity: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    durationMinutesText: string,
    quantity: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.durationMinutesText = durationMinutesText;
    this.quantity = quantity;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toWaitPolicyView(item: WaitPolicy): WaitPolicyView {
  return new WaitPolicyView(
    item.code,
    text.truncate(item.label, 64),
    String(item.durationMinutes),
    String(item.quantity),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitPolicyViews(items: WaitPolicy[]): WaitPolicyView[] {
  const views: WaitPolicyView[] = [];
  for (const item of items) {
    views.push(toWaitPolicyView(item));
  }
  return views;
}

export function sumWaitPolicyView(view: WaitPolicyView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedDurationMinutes + parsedQuantity;
}
