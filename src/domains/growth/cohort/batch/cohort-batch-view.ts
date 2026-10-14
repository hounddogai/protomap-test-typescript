import * as text from "../../../../kit/text.js";
import { CohortBatch } from "./cohort-batch.js";

/** How screens and exports show a cohort batch. */
export class CohortBatchView {
  code: string;
  name: string;
  expiresAt: string;
  floorValueText: string;
  cohort: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    floorValueText: string,
    cohort: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.floorValueText = floorValueText;
    this.cohort = cohort;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toCohortBatchView(item: CohortBatch): CohortBatchView {
  return new CohortBatchView(
    item.code,
    text.truncate(item.name, 40),
    String(item.expiresAt),
    item.floorValue.toFixed(2),
    item.cohort,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortBatchViews(items: CohortBatch[]): CohortBatchView[] {
  const views: CohortBatchView[] = [];
  for (const item of items) {
    views.push(toCohortBatchView(item));
  }
  return views;
}

export function sumCohortBatchView(view: CohortBatchView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedExpiresAt + parsedFloorValue + parsedThreshold;
}
