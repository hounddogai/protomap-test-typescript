import * as text from "../../../../kit/text.js";
import { BatchedExitRuleRecord } from "./batched-exit-rule-record.js";

/** How screens and exports show a batched exit rule record. */
export class BatchedExitRuleRecordView {
  code: string;
  label: string;
  durationMinutesText: string;
  minimum: string;
  revisionText: string;
  floorValue: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutesText: string,
    minimum: string,
    revisionText: string,
    floorValue: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.minimum = minimum;
    this.revisionText = revisionText;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedExitRuleRecordView(item: BatchedExitRuleRecord): BatchedExitRuleRecordView {
  return new BatchedExitRuleRecordView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    String(item.durationMinutes),
    item.minimum.toFixed(2),
    String(item.revision),
    item.floorValue.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedExitRuleRecordViews(items: BatchedExitRuleRecord[]): BatchedExitRuleRecordView[] {
  const views: BatchedExitRuleRecordView[] = [];
  for (const item of items) {
    views.push(toBatchedExitRuleRecordView(item));
  }
  return views;
}

export function sumBatchedExitRuleRecordView(view: BatchedExitRuleRecordView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedDurationMinutes + parsedMinimum + parsedRevision;
}
