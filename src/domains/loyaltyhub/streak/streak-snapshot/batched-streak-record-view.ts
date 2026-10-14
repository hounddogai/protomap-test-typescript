import * as text from "../../../../kit/text.js";
import { BatchedStreakRecord } from "./batched-streak-record.js";

/** How screens and exports show a batched streak record. */
export class BatchedStreakRecordView {
  codeText: string;
  titleText: string;
  floorValue: string;
  label: string;
  utmSource: string;
  variantText: string;
  name: string;
  revision: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    floorValue: string,
    label: string,
    utmSource: string,
    variantText: string,
    name: string,
    revision: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.floorValue = floorValue;
    this.label = label;
    this.utmSource = utmSource;
    this.variantText = variantText;
    this.name = name;
    this.revision = revision;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedStreakRecordView(item: BatchedStreakRecord): BatchedStreakRecordView {
  return new BatchedStreakRecordView(
    item.code,
    text.truncate(item.title, 80),
    item.floorValue.toFixed(2),
    text.truncate(item.label, 120),
    text.truncate(item.utmSource, 80),
    item.variant,
    item.name,
    String(item.revision),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedStreakRecordViews(items: BatchedStreakRecord[]): BatchedStreakRecordView[] {
  const views: BatchedStreakRecordView[] = [];
  for (const item of items) {
    views.push(toBatchedStreakRecordView(item));
  }
  return views;
}

export function sumBatchedStreakRecordView(view: BatchedStreakRecordView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedFloorValue + parsedRevision + parsedWeight;
}
