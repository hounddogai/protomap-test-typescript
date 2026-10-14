import { RollingCreditMapping } from "./rolling-credit-mapping.js";

/** How screens and exports show a rolling credit mapping. */
export class RollingCreditMappingView {
  code: string;
  title: string;
  quantityText: string;
  weight: string;
  graceDays: string;
  pinnedText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantityText: string,
    weight: string,
    graceDays: string,
    pinnedText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantityText = quantityText;
    this.weight = weight;
    this.graceDays = graceDays;
    this.pinnedText = pinnedText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCreditMappingView(item: RollingCreditMapping): RollingCreditMappingView {
  return new RollingCreditMappingView(
    item.code,
    item.title,
    String(item.quantity),
    item.weight.toFixed(2),
    String(item.graceDays),
    `${item.pinned}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCreditMappingViews(items: RollingCreditMapping[]): RollingCreditMappingView[] {
  const views: RollingCreditMappingView[] = [];
  for (const item of items) {
    views.push(toRollingCreditMappingView(item));
  }
  return views;
}

export function sumRollingCreditMappingView(view: RollingCreditMappingView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedQuantity + parsedWeight + parsedGraceDays;
}
