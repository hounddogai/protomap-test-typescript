import * as text from "../../../../kit/text.js";
import { ModelAdjustment } from "./model-adjustment.js";

/** How screens and exports show a model adjustment. */
export class ModelAdjustmentView {
  codeText: string;
  labelText: string;
  locale: string;
  quantity: string;
  timezone: string;
  summary: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    locale: string,
    quantity: string,
    timezone: string,
    summary: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.locale = locale;
    this.quantity = quantity;
    this.timezone = timezone;
    this.summary = summary;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toModelAdjustmentView(item: ModelAdjustment): ModelAdjustmentView {
  return new ModelAdjustmentView(
    item.code,
    item.label,
    text.truncate(item.locale, 120),
    String(item.quantity),
    item.timezone,
    item.summary,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelAdjustmentViews(items: ModelAdjustment[]): ModelAdjustmentView[] {
  const views: ModelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toModelAdjustmentView(item));
  }
  return views;
}

export function sumModelAdjustmentView(view: ModelAdjustmentView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
