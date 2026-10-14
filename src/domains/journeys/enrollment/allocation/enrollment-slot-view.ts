import * as text from "../../../../kit/text.js";
import { EnrollmentSlot } from "./enrollment-slot.js";

/** How screens and exports show a enrollment slot. */
export class EnrollmentSlotView {
  code: string;
  titleText: string;
  channel: string;
  threshold: string;
  localeText: string;
  utmSourceText: string;
  sendAt: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channel: string,
    threshold: string,
    localeText: string,
    utmSourceText: string,
    sendAt: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channel = channel;
    this.threshold = threshold;
    this.localeText = localeText;
    this.utmSourceText = utmSourceText;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentSlotView(item: EnrollmentSlot): EnrollmentSlotView {
  return new EnrollmentSlotView(
    item.code,
    item.title,
    item.channel,
    item.threshold.toFixed(2),
    item.locale,
    text.truncate(item.utmSource, 40),
    String(item.sendAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentSlotViews(items: EnrollmentSlot[]): EnrollmentSlotView[] {
  const views: EnrollmentSlotView[] = [];
  for (const item of items) {
    views.push(toEnrollmentSlotView(item));
  }
  return views;
}

export function sumEnrollmentSlotView(view: EnrollmentSlotView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedThreshold + parsedSendAt + parsedBatchSize;
}
