import * as text from "../../../../kit/text.js";
import { StrictCreativeRollup } from "./strict-creative-rollup.js";

/** How screens and exports show a strict creative rollup. */
export class StrictCreativeRollupView {
  codeText: string;
  label: string;
  quantity: string;
  checksum: string;
  batchSize: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    quantity: string,
    checksum: string,
    batchSize: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.quantity = quantity;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreativeRollupView(item: StrictCreativeRollup): StrictCreativeRollupView {
  return new StrictCreativeRollupView(
    text.truncate(item.code, 40),
    item.label,
    String(item.quantity),
    item.checksum,
    String(item.batchSize),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreativeRollupViews(items: StrictCreativeRollup[]): StrictCreativeRollupView[] {
  const views: StrictCreativeRollupView[] = [];
  for (const item of items) {
    views.push(toStrictCreativeRollupView(item));
  }
  return views;
}

export function sumStrictCreativeRollupView(view: StrictCreativeRollupView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedQuantity + parsedBatchSize;
}
