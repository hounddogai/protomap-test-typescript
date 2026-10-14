import { FallbackSenderBundle } from "./fallback-sender-bundle.js";

/** How screens and exports show a fallback sender bundle. */
export class FallbackSenderBundleView {
  codeText: string;
  title: string;
  quantity: string;
  weight: string;
  amountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    quantity: string,
    weight: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.quantity = quantity;
    this.weight = weight;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSenderBundleView(item: FallbackSenderBundle): FallbackSenderBundleView {
  return new FallbackSenderBundleView(
    item.code,
    item.title,
    String(item.quantity),
    item.weight.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSenderBundleViews(items: FallbackSenderBundle[]): FallbackSenderBundleView[] {
  const views: FallbackSenderBundleView[] = [];
  for (const item of items) {
    views.push(toFallbackSenderBundleView(item));
  }
  return views;
}

export function sumFallbackSenderBundleView(view: FallbackSenderBundleView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedQuantity + parsedWeight + parsedAmount;
}
