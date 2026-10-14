import * as text from "../../../../kit/text.js";
import { BatchedStepAdjustment } from "./batched-step-adjustment.js";

/** How screens and exports show a batched step adjustment. */
export class BatchedStepAdjustmentView {
  code: string;
  name: string;
  externalRefText: string;
  rate: string;
  segmentText: string;
  revision: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRefText: string,
    rate: string,
    segmentText: string,
    revision: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRefText = externalRefText;
    this.rate = rate;
    this.segmentText = segmentText;
    this.revision = revision;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedStepAdjustmentView(item: BatchedStepAdjustment): BatchedStepAdjustmentView {
  return new BatchedStepAdjustmentView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.externalRef, 40),
    item.rate.toFixed(2),
    item.segment,
    String(item.revision),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedStepAdjustmentViews(items: BatchedStepAdjustment[]): BatchedStepAdjustmentView[] {
  const views: BatchedStepAdjustmentView[] = [];
  for (const item of items) {
    views.push(toBatchedStepAdjustmentView(item));
  }
  return views;
}

export function sumBatchedStepAdjustmentView(view: BatchedStepAdjustmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedRate + parsedRevision + parsedWeight;
}
