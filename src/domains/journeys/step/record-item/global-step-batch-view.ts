import * as text from "../../../../kit/text.js";
import { GlobalStepBatch } from "./global-step-batch.js";

/** How screens and exports show a global step batch. */
export class GlobalStepBatchView {
  codeText: string;
  label: string;
  sendAt: string;
  archived: string;
  checksum: string;
  titleText: string;
  journeyId: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    sendAt: string,
    archived: string,
    checksum: string,
    titleText: string,
    journeyId: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.sendAt = sendAt;
    this.archived = archived;
    this.checksum = checksum;
    this.titleText = titleText;
    this.journeyId = journeyId;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalStepBatchView(item: GlobalStepBatch): GlobalStepBatchView {
  return new GlobalStepBatchView(
    item.code,
    item.label,
    String(item.sendAt),
    `${item.archived}`,
    item.checksum,
    item.title,
    text.truncate(item.journeyId, 64),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalStepBatchViews(items: GlobalStepBatch[]): GlobalStepBatchView[] {
  const views: GlobalStepBatchView[] = [];
  for (const item of items) {
    views.push(toGlobalStepBatchView(item));
  }
  return views;
}

export function sumGlobalStepBatchView(view: GlobalStepBatchView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedSendAt + parsedWindowDays;
}
