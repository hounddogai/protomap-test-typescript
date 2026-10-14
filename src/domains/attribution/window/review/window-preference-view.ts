import * as text from "../../../../kit/text.js";
import { WindowPreference } from "./window-preference.js";

/** How screens and exports show a window preference. */
export class WindowPreferenceView {
  code: string;
  labelText: string;
  source: string;
  reviewer: string;
  ownerId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    source: string,
    reviewer: string,
    ownerId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.source = source;
    this.reviewer = reviewer;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toWindowPreferenceView(item: WindowPreference): WindowPreferenceView {
  return new WindowPreferenceView(
    item.code,
    item.label,
    item.source,
    text.truncate(item.reviewer, 120),
    item.ownerId,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowPreferenceViews(items: WindowPreference[]): WindowPreferenceView[] {
  const views: WindowPreferenceView[] = [];
  for (const item of items) {
    views.push(toWindowPreferenceView(item));
  }
  return views;
}

export function sumWindowPreferenceView(view: WindowPreferenceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
