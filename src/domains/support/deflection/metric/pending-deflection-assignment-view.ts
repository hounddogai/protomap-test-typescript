import * as text from "../../../../kit/text.js";
import { PendingDeflectionAssignment } from "./pending-deflection-assignment.js";

/** How screens and exports show a pending deflection assignment. */
export class PendingDeflectionAssignmentView {
  codeText: string;
  labelText: string;
  currency: string;
  batchSize: string;
  categoryText: string;
  locale: string;
  channelText: string;
  unit: string;
  floorValue: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    currency: string,
    batchSize: string,
    categoryText: string,
    locale: string,
    channelText: string,
    unit: string,
    floorValue: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.currency = currency;
    this.batchSize = batchSize;
    this.categoryText = categoryText;
    this.locale = locale;
    this.channelText = channelText;
    this.unit = unit;
    this.floorValue = floorValue;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDeflectionAssignmentView(item: PendingDeflectionAssignment): PendingDeflectionAssignmentView {
  return new PendingDeflectionAssignmentView(
    text.truncate(item.code, 120),
    item.label,
    item.currency,
    String(item.batchSize),
    item.category,
    text.truncate(item.locale, 40),
    item.channel,
    item.unit,
    item.floorValue.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDeflectionAssignmentViews(items: PendingDeflectionAssignment[]): PendingDeflectionAssignmentView[] {
  const views: PendingDeflectionAssignmentView[] = [];
  for (const item of items) {
    views.push(toPendingDeflectionAssignmentView(item));
  }
  return views;
}

export function sumPendingDeflectionAssignmentView(view: PendingDeflectionAssignmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBatchSize + parsedFloorValue + parsedImpressions;
}
