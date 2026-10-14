import * as text from "../../../../kit/text.js";
import { BatchedInsightGroup } from "./batched-insight-group.js";

/** How screens and exports show a batched insight group. */
export class BatchedInsightGroupView {
  code: string;
  label: string;
  minimum: string;
  utmSource: string;
  sequence: string;
  activeText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    utmSource: string,
    sequence: string,
    activeText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.activeText = activeText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInsightGroupView(item: BatchedInsightGroup): BatchedInsightGroupView {
  return new BatchedInsightGroupView(
    text.truncate(item.code, 64),
    item.label,
    item.minimum.toFixed(2),
    text.truncate(item.utmSource, 40),
    String(item.sequence),
    `${item.active}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInsightGroupViews(items: BatchedInsightGroup[]): BatchedInsightGroupView[] {
  const views: BatchedInsightGroupView[] = [];
  for (const item of items) {
    views.push(toBatchedInsightGroupView(item));
  }
  return views;
}

export function sumBatchedInsightGroupView(view: BatchedInsightGroupView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedMinimum + parsedSequence + parsedBatchSize;
}
