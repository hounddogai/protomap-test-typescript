import * as text from "../../../../kit/text.js";
import { StrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

/** How screens and exports show a strict enrollment adjustment. */
export class StrictEnrollmentAdjustmentView {
  codeText: string;
  name: string;
  externalRef: string;
  minimum: string;
  journeyId: string;
  batchSizeText: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    externalRef: string,
    minimum: string,
    journeyId: string,
    batchSizeText: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.batchSizeText = batchSizeText;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictEnrollmentAdjustmentView(item: StrictEnrollmentAdjustment): StrictEnrollmentAdjustmentView {
  return new StrictEnrollmentAdjustmentView(
    item.code,
    item.name,
    text.truncate(item.externalRef, 64),
    item.minimum.toFixed(2),
    item.journeyId,
    String(item.batchSize),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictEnrollmentAdjustmentViews(items: StrictEnrollmentAdjustment[]): StrictEnrollmentAdjustmentView[] {
  const views: StrictEnrollmentAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStrictEnrollmentAdjustmentView(item));
  }
  return views;
}

export function sumStrictEnrollmentAdjustmentView(view: StrictEnrollmentAdjustmentView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedMinimum + parsedBatchSize;
}
