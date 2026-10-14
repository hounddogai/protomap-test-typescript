import * as text from "../../../../kit/text.js";
import { ManualInsightOverride } from "./manual-insight-override.js";

/** How screens and exports show a manual insight override. */
export class ManualInsightOverrideView {
  code: string;
  title: string;
  quantity: string;
  active: string;
  graceDays: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantity: string,
    active: string,
    graceDays: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.active = active;
    this.graceDays = graceDays;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toManualInsightOverrideView(item: ManualInsightOverride): ManualInsightOverrideView {
  return new ManualInsightOverrideView(
    text.truncate(item.code, 120),
    item.title,
    String(item.quantity),
    `${item.active}`,
    String(item.graceDays),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualInsightOverrideViews(items: ManualInsightOverride[]): ManualInsightOverrideView[] {
  const views: ManualInsightOverrideView[] = [];
  for (const item of items) {
    views.push(toManualInsightOverrideView(item));
  }
  return views;
}

export function sumManualInsightOverrideView(view: ManualInsightOverrideView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedQuantity + parsedGraceDays;
}
