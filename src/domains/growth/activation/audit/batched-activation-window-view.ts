import * as text from "../../../../kit/text.js";
import { BatchedActivationWindow } from "./batched-activation-window.js";

/** How screens and exports show a batched activation window. */
export class BatchedActivationWindowView {
  codeText: string;
  label: string;
  cost: string;
  variantText: string;
  updatedAtText: string;
  segmentText: string;
  clicks: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cost: string,
    variantText: string,
    updatedAtText: string,
    segmentText: string,
    clicks: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cost = cost;
    this.variantText = variantText;
    this.updatedAtText = updatedAtText;
    this.segmentText = segmentText;
    this.clicks = clicks;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedActivationWindowView(item: BatchedActivationWindow): BatchedActivationWindowView {
  return new BatchedActivationWindowView(
    item.code,
    text.truncate(item.label, 64),
    item.cost.toFixed(2),
    item.variant,
    String(item.updatedAt),
    item.segment,
    String(item.clicks),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedActivationWindowViews(items: BatchedActivationWindow[]): BatchedActivationWindowView[] {
  const views: BatchedActivationWindowView[] = [];
  for (const item of items) {
    views.push(toBatchedActivationWindowView(item));
  }
  return views;
}

export function sumBatchedActivationWindowView(view: BatchedActivationWindowView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedCost + parsedUpdatedAt + parsedClicks;
}
