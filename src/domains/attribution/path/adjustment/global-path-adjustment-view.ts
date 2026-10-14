import * as text from "../../../../kit/text.js";
import { GlobalPathAdjustment } from "./global-path-adjustment.js";

/** How screens and exports show a global path adjustment. */
export class GlobalPathAdjustmentView {
  code: string;
  label: string;
  utmSourceText: string;
  category: string;
  amount: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSourceText: string,
    category: string,
    amount: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSourceText = utmSourceText;
    this.category = category;
    this.amount = amount;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPathAdjustmentView(item: GlobalPathAdjustment): GlobalPathAdjustmentView {
  return new GlobalPathAdjustmentView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.utmSource, 64),
    item.category,
    item.amount.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPathAdjustmentViews(items: GlobalPathAdjustment[]): GlobalPathAdjustmentView[] {
  const views: GlobalPathAdjustmentView[] = [];
  for (const item of items) {
    views.push(toGlobalPathAdjustmentView(item));
  }
  return views;
}

export function sumGlobalPathAdjustmentView(view: GlobalPathAdjustmentView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedAmount + parsedSendAt;
}
