import * as text from "../../../../kit/text.js";
import { ActivationBaseline } from "./activation-baseline.js";

/** How screens and exports show a activation baseline. */
export class ActivationBaselineView {
  code: string;
  labelText: string;
  batchSize: string;
  pinned: string;
  unitText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    batchSize: string,
    pinned: string,
    unitText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.batchSize = batchSize;
    this.pinned = pinned;
    this.unitText = unitText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toActivationBaselineView(item: ActivationBaseline): ActivationBaselineView {
  return new ActivationBaselineView(
    item.code,
    text.truncate(item.label, 80),
    String(item.batchSize),
    `${item.pinned}`,
    text.truncate(item.unit, 80),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationBaselineViews(items: ActivationBaseline[]): ActivationBaselineView[] {
  const views: ActivationBaselineView[] = [];
  for (const item of items) {
    views.push(toActivationBaselineView(item));
  }
  return views;
}

export function sumActivationBaselineView(view: ActivationBaselineView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBatchSize + parsedPriority;
}
