import * as text from "../../../../kit/text.js";
import { BatchedPlacementTemplate } from "./batched-placement-template.js";

/** How screens and exports show a batched placement template. */
export class BatchedPlacementTemplateView {
  codeText: string;
  labelText: string;
  phoneText: string;
  updatedAt: string;
  discount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    phoneText: string,
    updatedAt: string,
    discount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.phoneText = phoneText;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPlacementTemplateView(item: BatchedPlacementTemplate): BatchedPlacementTemplateView {
  return new BatchedPlacementTemplateView(
    item.code,
    item.label,
    text.truncate(item.phone, 120),
    String(item.updatedAt),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPlacementTemplateViews(items: BatchedPlacementTemplate[]): BatchedPlacementTemplateView[] {
  const views: BatchedPlacementTemplateView[] = [];
  for (const item of items) {
    views.push(toBatchedPlacementTemplateView(item));
  }
  return views;
}

export function sumBatchedPlacementTemplateView(view: BatchedPlacementTemplateView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedUpdatedAt + parsedDiscount;
}
