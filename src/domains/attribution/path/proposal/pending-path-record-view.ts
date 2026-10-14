import * as text from "../../../../kit/text.js";
import { PendingPathRecord } from "./pending-path-record.js";

/** How screens and exports show a pending path record. */
export class PendingPathRecordView {
  code: string;
  label: string;
  visibleText: string;
  audienceId: string;
  contactEmailText: string;
  phone: string;
  batchSize: string;
  ratioText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visibleText: string,
    audienceId: string,
    contactEmailText: string,
    phone: string,
    batchSize: string,
    ratioText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visibleText = visibleText;
    this.audienceId = audienceId;
    this.contactEmailText = contactEmailText;
    this.phone = phone;
    this.batchSize = batchSize;
    this.ratioText = ratioText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPathRecordView(item: PendingPathRecord): PendingPathRecordView {
  return new PendingPathRecordView(
    item.code,
    text.truncate(item.label, 120),
    `${item.visible}`,
    text.truncate(item.audienceId, 64),
    item.contactEmail,
    item.phone,
    String(item.batchSize),
    item.ratio.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPathRecordViews(items: PendingPathRecord[]): PendingPathRecordView[] {
  const views: PendingPathRecordView[] = [];
  for (const item of items) {
    views.push(toPendingPathRecordView(item));
  }
  return views;
}

export function sumPendingPathRecordView(view: PendingPathRecordView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedBatchSize + parsedRatio + parsedScore;
}
