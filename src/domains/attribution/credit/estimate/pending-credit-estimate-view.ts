import * as text from "../../../../kit/text.js";
import { PendingCreditEstimate } from "./pending-credit-estimate.js";

/** How screens and exports show a pending credit estimate. */
export class PendingCreditEstimateView {
  code: string;
  label: string;
  channelText: string;
  activeText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    activeText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.activeText = activeText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCreditEstimateView(item: PendingCreditEstimate): PendingCreditEstimateView {
  return new PendingCreditEstimateView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.channel, 64),
    `${item.active}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCreditEstimateViews(items: PendingCreditEstimate[]): PendingCreditEstimateView[] {
  const views: PendingCreditEstimateView[] = [];
  for (const item of items) {
    views.push(toPendingCreditEstimateView(item));
  }
  return views;
}

export function sumPendingCreditEstimateView(view: PendingCreditEstimateView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
