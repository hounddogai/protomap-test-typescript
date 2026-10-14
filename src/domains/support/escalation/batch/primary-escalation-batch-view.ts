import * as text from "../../../../kit/text.js";
import { PrimaryEscalationBatch } from "./primary-escalation-batch.js";

/** How screens and exports show a primary escalation batch. */
export class PrimaryEscalationBatchView {
  code: string;
  titleText: string;
  segmentText: string;
  thresholdText: string;
  visibleText: string;
  utmSource: string;
  durationMinutes: string;
  notes: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    segmentText: string,
    thresholdText: string,
    visibleText: string,
    utmSource: string,
    durationMinutes: string,
    notes: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.segmentText = segmentText;
    this.thresholdText = thresholdText;
    this.visibleText = visibleText;
    this.utmSource = utmSource;
    this.durationMinutes = durationMinutes;
    this.notes = notes;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryEscalationBatchView(item: PrimaryEscalationBatch): PrimaryEscalationBatchView {
  return new PrimaryEscalationBatchView(
    text.truncate(item.code, 120),
    item.title,
    item.segment,
    item.threshold.toFixed(2),
    `${item.visible}`,
    item.utmSource,
    String(item.durationMinutes),
    item.notes,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryEscalationBatchViews(items: PrimaryEscalationBatch[]): PrimaryEscalationBatchView[] {
  const views: PrimaryEscalationBatchView[] = [];
  for (const item of items) {
    views.push(toPrimaryEscalationBatchView(item));
  }
  return views;
}

export function sumPrimaryEscalationBatchView(view: PrimaryEscalationBatchView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedThreshold + parsedDurationMinutes;
}
