import * as text from "../../../../kit/text.js";
import { PathAdjustment } from "./path-adjustment.js";

/** How screens and exports show a path adjustment. */
export class PathAdjustmentView {
  code: string;
  labelText: string;
  capacityText: string;
  variant: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    capacityText: string,
    variant: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.capacityText = capacityText;
    this.variant = variant;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPathAdjustmentView(item: PathAdjustment): PathAdjustmentView {
  return new PathAdjustmentView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    String(item.capacity),
    item.variant,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathAdjustmentViews(items: PathAdjustment[]): PathAdjustmentView[] {
  const views: PathAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPathAdjustmentView(item));
  }
  return views;
}

export function sumPathAdjustmentView(view: PathAdjustmentView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedCapacity + parsedBatchSize;
}
