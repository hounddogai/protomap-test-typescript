import * as text from "../../../../kit/text.js";
import { StepSegment } from "./step-segment.js";

/** How screens and exports show a step segment. */
export class StepSegmentView {
  codeText: string;
  label: string;
  minimum: string;
  sendAt: string;
  currency: string;
  thresholdText: string;
  descriptionText: string;
  capacity: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    minimum: string,
    sendAt: string,
    currency: string,
    thresholdText: string,
    descriptionText: string,
    capacity: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.currency = currency;
    this.thresholdText = thresholdText;
    this.descriptionText = descriptionText;
    this.capacity = capacity;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toStepSegmentView(item: StepSegment): StepSegmentView {
  return new StepSegmentView(
    item.code,
    text.truncate(item.label, 80),
    item.minimum.toFixed(2),
    String(item.sendAt),
    item.currency,
    item.threshold.toFixed(2),
    item.description,
    String(item.capacity),
    text.truncate(item.source, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepSegmentViews(items: StepSegment[]): StepSegmentView[] {
  const views: StepSegmentView[] = [];
  for (const item of items) {
    views.push(toStepSegmentView(item));
  }
  return views;
}

export function sumStepSegmentView(view: StepSegmentView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedMinimum + parsedSendAt + parsedThreshold;
}
