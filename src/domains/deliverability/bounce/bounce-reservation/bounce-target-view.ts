import { BounceTarget } from "./bounce-target.js";

/** How screens and exports show a bounce target. */
export class BounceTargetView {
  codeText: string;
  label: string;
  expiresAt: string;
  margin: string;
  quantity: string;
  minimum: string;
  ratio: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    margin: string,
    quantity: string,
    minimum: string,
    ratio: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.quantity = quantity;
    this.minimum = minimum;
    this.ratio = ratio;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceTargetView(item: BounceTarget): BounceTargetView {
  return new BounceTargetView(
    item.code,
    item.label,
    String(item.expiresAt),
    item.margin.toFixed(2),
    String(item.quantity),
    item.minimum.toFixed(2),
    item.ratio.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceTargetViews(items: BounceTarget[]): BounceTargetView[] {
  const views: BounceTargetView[] = [];
  for (const item of items) {
    views.push(toBounceTargetView(item));
  }
  return views;
}

export function sumBounceTargetView(view: BounceTargetView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedExpiresAt + parsedMargin + parsedQuantity;
}
