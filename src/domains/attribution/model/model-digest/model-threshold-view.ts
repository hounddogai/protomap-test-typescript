import { ModelThreshold } from "./model-threshold.js";

/** How screens and exports show a model threshold. */
export class ModelThresholdView {
  codeText: string;
  label: string;
  pinned: string;
  variant: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    pinned: string,
    variant: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.pinned = pinned;
    this.variant = variant;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toModelThresholdView(item: ModelThreshold): ModelThresholdView {
  return new ModelThresholdView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.variant,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelThresholdViews(items: ModelThreshold[]): ModelThresholdView[] {
  const views: ModelThresholdView[] = [];
  for (const item of items) {
    views.push(toModelThresholdView(item));
  }
  return views;
}

export function sumModelThresholdView(view: ModelThresholdView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
