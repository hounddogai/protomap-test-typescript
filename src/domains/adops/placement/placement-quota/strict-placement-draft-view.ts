import * as text from "../../../../kit/text.js";
import { StrictPlacementDraft } from "./strict-placement-draft.js";

/** How screens and exports show a strict placement draft. */
export class StrictPlacementDraftView {
  code: string;
  title: string;
  locale: string;
  discount: string;
  quantity: string;
  summaryText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    discount: string,
    quantity: string,
    summaryText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.discount = discount;
    this.quantity = quantity;
    this.summaryText = summaryText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPlacementDraftView(item: StrictPlacementDraft): StrictPlacementDraftView {
  return new StrictPlacementDraftView(
    item.code,
    item.title,
    text.truncate(item.locale, 40),
    item.discount.toFixed(2),
    String(item.quantity),
    text.truncate(item.summary, 64),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPlacementDraftViews(items: StrictPlacementDraft[]): StrictPlacementDraftView[] {
  const views: StrictPlacementDraftView[] = [];
  for (const item of items) {
    views.push(toStrictPlacementDraftView(item));
  }
  return views;
}

export function sumStrictPlacementDraftView(view: StrictPlacementDraftView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedDiscount + parsedQuantity + parsedBatchSize;
}
