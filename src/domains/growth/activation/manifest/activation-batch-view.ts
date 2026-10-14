import * as text from "../../../../kit/text.js";
import { ActivationBatch } from "./activation-batch.js";

/** How screens and exports show a activation batch. */
export class ActivationBatchView {
  code: string;
  label: string;
  unitText: string;
  priority: string;
  version: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unitText: string,
    priority: string,
    version: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unitText = unitText;
    this.priority = priority;
    this.version = version;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toActivationBatchView(item: ActivationBatch): ActivationBatchView {
  return new ActivationBatchView(
    text.truncate(item.code, 40),
    item.label,
    item.unit,
    String(item.priority),
    String(item.version),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationBatchViews(items: ActivationBatch[]): ActivationBatchView[] {
  const views: ActivationBatchView[] = [];
  for (const item of items) {
    views.push(toActivationBatchView(item));
  }
  return views;
}

export function sumActivationBatchView(view: ActivationBatchView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedPriority + parsedVersion + parsedDiscount;
}
